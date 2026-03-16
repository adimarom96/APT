/**
 * nadlan.gov.il Crawler
 * Fetches Israeli real estate transactions from the government property database
 * and upserts them into PostgreSQL.
 *
 * Usage:
 *   node crawler.js                              # full run (5 cities × 10 pages)
 *   node crawler.js --dry-run                    # print data, skip DB writes
 *   node crawler.js --city 5000 --pages 3        # 3 pages of Tel Aviv only
 *   node crawler.js --city 5000 --pages 50 --dry-run
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { Pool } = require('pg');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const cityArgIdx = args.indexOf('--city');
const CITY_FILTER = cityArgIdx !== -1 ? args[cityArgIdx + 1] : null;
const pagesArgIdx = args.indexOf('--pages');
const PAGES_OVERRIDE = pagesArgIdx !== -1 ? parseInt(args[pagesArgIdx + 1]) : null;

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = 'https://www.nadlan.gov.il/Nadlan.REST/Main/GetAssestAndDeals';

const CITIES = [
  { id: '5000', name: 'תל אביב' },
  { id: '3000', name: 'ירושלים' },
  { id: '4000', name: 'חיפה' },
  { id: '7000', name: 'באר שבע' },
  { id: '7400', name: 'נתניה' },
];

const DEFAULT_PAGES = 10;
const PAGE_DELAY_MS = 2500;   // 2.5s between pages (required to avoid blocking)
const CITY_DELAY_MS = 5000;   // 5s between cities
const MAX_RETRIES = 3;

// ─── DB Schema ────────────────────────────────────────────────────────────────
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS deals (
  id              SERIAL PRIMARY KEY,
  deal_key        TEXT UNIQUE NOT NULL,
  city_name       TEXT,
  full_address    TEXT,
  display_address TEXT,
  gush            TEXT,
  deal_date       DATE,
  deal_datetime   TIMESTAMPTZ,
  deal_nature     TEXT,
  asset_type      TEXT,
  rooms           NUMERIC(4,1),
  floor           INTEGER,
  building_floors INTEGER,
  area_sqm        NUMERIC(10,2),
  deal_amount     BIGINT,
  price_per_sqm   NUMERIC(12,2),
  building_year   INTEGER,
  year_built      INTEGER,
  is_new_project  BOOLEAN,
  project_name    TEXT,
  trend_format    TEXT,
  trend_negative  BOOLEAN,
  polygon_id      TEXT,
  raw_json        JSONB,
  scraped_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_city_name   ON deals (city_name);
CREATE INDEX IF NOT EXISTS idx_deals_deal_date   ON deals (deal_date);
CREATE INDEX IF NOT EXISTS idx_deals_rooms       ON deals (rooms);
CREATE INDEX IF NOT EXISTS idx_deals_deal_amount ON deals (deal_amount);
CREATE INDEX IF NOT EXISTS idx_deals_gush        ON deals (gush);
CREATE INDEX IF NOT EXISTS idx_deals_polygon_id  ON deals (polygon_id);
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function parseDate(val) {
  if (!val) return null;
  // Format from API: "2023-05-14T00:00:00" or "/Date(1684022400000)/"
  if (typeof val === 'string' && val.startsWith('/Date(')) {
    const ms = parseInt(val.replace('/Date(', '').replace(')/', ''));
    return isNaN(ms) ? null : new Date(ms).toISOString();
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ─── Transform ────────────────────────────────────────────────────────────────
function transformDeal(raw, cityName) {
  const amount = parseNumber(raw.DEALAMOUNT);
  const areaSqm = parseNumber(raw.FLOARAREA) || parseNumber(raw.TOTALFLOORAREA);
  const pricePerSqm = (amount && areaSqm && areaSqm > 0)
    ? Math.round(amount / areaSqm)
    : null;

  const dealKey = raw.KEYVALUE || raw.OBJECTID || `${raw.FULLADRESS}-${raw.DEALDATETIME}-${amount}`;

  return {
    deal_key:        String(dealKey),
    city_name:       cityName,
    full_address:    raw.FULLADRESS || null,
    display_address: raw.DISPLAYADRESS || raw.FULLADRESS || null,
    gush:            raw.GUSH ? String(raw.GUSH) : null,
    deal_date:       parseDate(raw.DEALDATETIME)
                       ? new Date(parseDate(raw.DEALDATETIME)).toISOString().split('T')[0]
                       : null,
    deal_datetime:   parseDate(raw.DEALDATETIME),
    deal_nature:     raw.DEALNATUREDESCRIPTION || null,
    asset_type:      raw.TYPE || raw.ASSETTYPEDESCRIPTION || null,
    rooms:           parseNumber(raw.ASSETROOMNUM),
    floor:           raw.FLOORNO != null ? parseInt(raw.FLOORNO) : null,
    building_floors: raw.BUILDINGFLOORS != null ? parseInt(raw.BUILDINGFLOORS) : null,
    area_sqm:        areaSqm,
    deal_amount:     amount ? BigInt(Math.round(amount)) : null,
    price_per_sqm:   pricePerSqm,
    building_year:   raw.BUILDINGYEAR ? parseInt(raw.BUILDINGYEAR) : null,
    year_built:      raw.YEARBUILT ? parseInt(raw.YEARBUILT) : null,
    is_new_project:  raw.NEWPROJECTTEXT != null && raw.NEWPROJECTTEXT !== '' ? true : false,
    project_name:    raw.PROJECTNAME || raw.NEWPROJECTTEXT || null,
    trend_format:    raw.TREND_FORMAT || null,
    trend_negative:  raw.TREND_IS_NEGATIVE === true || raw.TREND_IS_NEGATIVE === 'true',
    polygon_id:      raw.POLYGON_ID ? String(raw.POLYGON_ID) : null,
    raw_json:        raw,
  };
}

// ─── Fetch page ───────────────────────────────────────────────────────────────
async function fetchPage(cityId, pageNo, retries = 0) {
  const body = {
    ObjectID: cityId,
    ObjectIDType: 'string',
    ObjectKey: 'SEMEL_YISHUV',
    DescLayerID: 'YISHUV_AREA',
    ResultType: 2,
    PageNo: pageNo,
    OrderByFilled: 'DEALDATETIME',
    OrderByDescending: true,
    DealType: 1,
    DealSubType: 1,
    AssetClassID: 0,
    AssetSubClassID: 0,
    Filter: null,
    IgnoreFilter: false,
    ShowAllAssets: false,
    ShowRegionDeals: false,
    IsFirstLoad: false,
    DescLayerIDForAssetType: null,
    UseObjectIdForDesc: false,
    UseObjectIdForStat: false,
    IsDeveloper: false,
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.nadlan.gov.il',
        'Referer': 'https://www.nadlan.gov.il/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429 || res.status === 503) {
      if (retries < MAX_RETRIES) {
        const delay = Math.pow(2, retries + 1) * 1000;
        console.log(`  Rate limited (${res.status}), retrying in ${delay}ms...`);
        await sleep(delay);
        return fetchPage(cityId, pageNo, retries + 1);
      }
      throw new Error(`Rate limited after ${MAX_RETRIES} retries (status ${res.status})`);
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // API can return { Data: { AllResults: [...], TotalResults: N } }
    // or { AllResults: [...], TotalResults: N }
    const payload = data.Data || data;
    return {
      results: payload.AllResults || [],
      total: payload.TotalResults || 0,
    };
  } catch (err) {
    if (retries < MAX_RETRIES) {
      const delay = Math.pow(2, retries + 1) * 1000;
      console.log(`  Error: ${err.message}, retrying in ${delay}ms...`);
      await sleep(delay);
      return fetchPage(cityId, pageNo, retries + 1);
    }
    throw err;
  }
}

// ─── DB upsert ────────────────────────────────────────────────────────────────
async function upsertDeals(pool, deals) {
  if (!deals.length) return 0;

  const client = await pool.connect();
  let inserted = 0;
  try {
    for (const deal of deals) {
      await client.query(
        `INSERT INTO deals (
          deal_key, city_name, full_address, display_address, gush,
          deal_date, deal_datetime, deal_nature, asset_type, rooms,
          floor, building_floors, area_sqm, deal_amount, price_per_sqm,
          building_year, year_built, is_new_project, project_name,
          trend_format, trend_negative, polygon_id, raw_json, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NOW()
        )
        ON CONFLICT (deal_key) DO UPDATE SET
          updated_at = NOW(),
          deal_amount = EXCLUDED.deal_amount,
          price_per_sqm = EXCLUDED.price_per_sqm,
          raw_json = EXCLUDED.raw_json`,
        [
          deal.deal_key, deal.city_name, deal.full_address, deal.display_address,
          deal.gush, deal.deal_date, deal.deal_datetime, deal.deal_nature,
          deal.asset_type, deal.rooms, deal.floor, deal.building_floors,
          deal.area_sqm, deal.deal_amount, deal.price_per_sqm,
          deal.building_year, deal.year_built, deal.is_new_project,
          deal.project_name, deal.trend_format, deal.trend_negative,
          deal.polygon_id, JSON.stringify(deal.raw_json),
        ]
      );
      inserted++;
    }
  } finally {
    client.release();
  }
  return inserted;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🏠 nadlan.gov.il Crawler');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE'}`);
  console.log('');

  // Set up DB (unless dry-run)
  let pool = null;
  if (!DRY_RUN) {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not set. Copy .env.example → .env and fill it in.');
      process.exit(1);
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    try {
      console.log('📦 Creating schema if not exists...');
      await client.query(SCHEMA_SQL);
      console.log('   Schema ready.\n');
    } finally {
      client.release();
    }
  }

  const citiesToRun = CITY_FILTER
    ? CITIES.filter(c => c.id === CITY_FILTER)
    : CITIES;

  if (!citiesToRun.length) {
    console.error(`❌ No city found with ID "${CITY_FILTER}". Valid IDs: ${CITIES.map(c => c.id).join(', ')}`);
    process.exit(1);
  }

  let totalDeals = 0;
  let totalInserted = 0;

  for (let ci = 0; ci < citiesToRun.length; ci++) {
    const city = citiesToRun[ci];
    const pagesToFetch = PAGES_OVERRIDE || DEFAULT_PAGES;

    console.log(`📍 City: ${city.name} (ID: ${city.id})`);

    // Probe page 1 to get total
    let firstPage;
    try {
      firstPage = await fetchPage(city.id, 1);
    } catch (err) {
      console.error(`  ❌ Failed to fetch page 1: ${err.message}`);
      continue;
    }

    const totalResults = firstPage.total;
    console.log(`   Total transactions available: ${totalResults.toLocaleString()}`);

    if (DRY_RUN && firstPage.results.length > 0) {
      console.log('   Sample field names:', Object.keys(firstPage.results[0]).slice(0, 15).join(', '));
      console.log('   Sample record:', JSON.stringify(firstPage.results[0], null, 2).slice(0, 500));
    }

    // Process all pages
    for (let page = 1; page <= pagesToFetch; page++) {
      let pageData;
      if (page === 1) {
        pageData = firstPage;
      } else {
        await sleep(PAGE_DELAY_MS);
        try {
          pageData = await fetchPage(city.id, page);
        } catch (err) {
          console.error(`  ❌ Page ${page} failed: ${err.message}`);
          break;
        }
      }

      if (!pageData.results.length) {
        console.log(`  Page ${page}: no results (end of data)`);
        break;
      }

      const deals = pageData.results
        .map(r => transformDeal(r, city.name))
        .filter(d => d.deal_key && d.deal_amount);

      console.log(`  Page ${page}/${pagesToFetch}: ${deals.length} deals (${pageData.results.length} raw)`);

      totalDeals += deals.length;

      if (!DRY_RUN && deals.length > 0) {
        const inserted = await upsertDeals(pool, deals);
        totalInserted += inserted;
        process.stdout.write(`    ↳ ${inserted} upserted to DB\n`);
      }
    }

    if (ci < citiesToRun.length - 1) {
      console.log(`\n  ⏳ Waiting ${CITY_DELAY_MS / 1000}s before next city...\n`);
      await sleep(CITY_DELAY_MS);
    }
  }

  console.log('\n✅ Done!');
  console.log(`   Processed: ${totalDeals.toLocaleString()} deals`);
  if (!DRY_RUN) {
    console.log(`   Upserted:  ${totalInserted.toLocaleString()} to DB`);
  }

  if (pool) await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
