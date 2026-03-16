# nadlan-crawler

Fetches Israeli real estate transactions from [nadlan.gov.il](https://www.nadlan.gov.il) (the official government property transaction database) and stores them in PostgreSQL.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

## Usage

```bash
# Test without writing to DB (inspect field names)
node crawler.js --dry-run

# 3 pages of Tel Aviv only (dry-run)
node crawler.js --city 5000 --pages 3 --dry-run

# Full run: 5 cities × 10 pages each (~500–1000 deals)
node crawler.js

# Deep run on Tel Aviv only
node crawler.js --city 5000 --pages 50
```

## City IDs

| City | ID |
|------|----|
| תל אביב (Tel Aviv) | 5000 |
| ירושלים (Jerusalem) | 3000 |
| חיפה (Haifa) | 4000 |
| באר שבע (Beer Sheva) | 7000 |
| נתניה (Netanya) | 7400 |

To find IDs for other cities: open nadlan.gov.il → search a city → DevTools → Network → look for POST to `GetAssestAndDeals` → copy `ObjectID` from request body.

## What it stores

Each deal row includes:
- Address, city, neighborhood (polygon_id)
- Sale price (`deal_amount`)
- Price per sqm (`price_per_sqm`) — computed automatically
- Number of rooms, floor, building floors
- Area in sqm
- Construction year
- Deal date
- Asset type (apartment/land/etc.)
- Whether it's a new development project

## Rate limiting

The crawler uses:
- 2.5s delay between pages
- 5s delay between cities
- Up to 3 retries with exponential backoff on errors

For high-volume production scraping, add proxy rotation (BrightData, Oxylabs).

## Weekly cron job

```cron
0 3 * * 0  cd /path/to/nadlan-crawler && node crawler.js >> logs/crawler.log 2>&1
```

## Schema

The schema is created automatically on first run. Key table: `deals`.
See `crawler.js` → `SCHEMA_SQL` for the full definition.
