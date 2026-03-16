# 🏠 נדל"ן ישראל — Israeli Real Estate Investment Platform

A Hebrew-first, data-driven platform for first-time real estate investors in Israel.
Built with Next.js 14, PostgreSQL (Supabase), Prisma, Recharts, and the Anthropic Claude API.

---

## What's Inside

```
APT/
├── nadlan-crawler/          # Node.js data crawler for nadlan.gov.il
│   ├── crawler.js           # Main crawler with DB schema
│   ├── .env.example
│   └── README.md
└── real-estate-app/         # Next.js 14 web app
    ├── app/                 # App Router pages + API routes
    │   ├── page.tsx         # Homepage
    │   ├── city/[name]/     # City detail page
    │   ├── compare/         # Area comparison page
    │   ├── calculator/      # Yield + mortgage calculators
    │   └── api/             # API routes
    ├── components/          # Shared React components
    ├── lib/                 # Business logic (yield, mortgage, tax)
    ├── prisma/              # Prisma schema
    └── .env.example
```

---

## Quick Setup (15 minutes)

### Step 1 — Create a Supabase database (free)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name, password, and region (e.g. Frankfurt)
3. Once created: **Settings → Database → Connection string → URI**
4. Copy the connection string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```

### Step 2 — Get an Anthropic API key (for the chatbot)

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys
2. Create a new key

### Step 3 — Set up the web app

```bash
cd real-estate-app

# Install dependencies
npm install

# Copy and fill in env vars
cp .env.example .env.local
# Edit .env.local: set DATABASE_URL and ANTHROPIC_API_KEY

# Create the database tables
npx prisma db push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4 — Seed the database with real data

```bash
cd ../nadlan-crawler
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL (same as above)

# Test without writing to DB
node crawler.js --dry-run --city 5000 --pages 2

# Load real data (5 cities × 10 pages each)
node crawler.js
```

After the crawler runs (~5 minutes), refresh the homepage to see real data.

---

## Features

| Feature | Status | Route |
|---------|--------|-------|
| City price data + trends | ✅ | `/city/[name]` |
| Price trend chart (5yr) | ✅ | `/city/[name]` |
| Room distribution chart | ✅ | `/city/[name]` |
| Recent transactions table | ✅ | `/city/[name]` |
| Yield calculator | ✅ | `/calculator/yield` |
| Mortgage simulator | ✅ | `/calculator/mortgage` |
| Purchase tax calculator | ✅ | `/calculator/yield` |
| Area comparison | ✅ | `/compare` |
| AI chatbot (Hebrew) | ✅ | Floating button |
| API: cities, deals, stats | ✅ | `/api/*` |

---

## API Reference

All API routes are under `/api/`:

```
GET /api/cities
  → [{ name, dealCount, avgPricePerSqm }]

GET /api/deals?city=תל+אביב&rooms=3&page=1
  → { deals: [...], total, page, pages }

GET /api/stats?city=תל+אביב&rooms=3
  → { summary, priceHistory, byRooms }

GET /api/neighborhoods?city=תל+אביב
  → [{ polygonId, dealCount, avgPricePerSqm, avgDealAmount }]

GET /api/yield?price=1500000&rent=5500&expenses=500
  → { grossYield, netYield, breakEvenYears, ... }

GET /api/mortgage?price=2000000&equity=500000&rate=5.5&years=25
  → { monthlyPayment, totalCost, totalInterest, ltv, ... }

POST /api/chat
  Body: { messages: [{role, content}], cityContext? }
  → SSE stream of text deltas
```

---

## Data Sources

- **nadlan.gov.il** — All Israeli property sales since 2008 (primary source)
- **data.gov.il** — Building permits, school data, socioeconomic data (planned v1.1)
- **boi.org.il** — Bank of Israel interest rates (planned v1.1)

---

## Infrastructure

| Service | Cost | Purpose |
|---------|------|---------|
| [Vercel](https://vercel.com) | Free–$20/mo | Hosting (Next.js) |
| [Supabase](https://supabase.com) | $25/mo | PostgreSQL database |
| [Anthropic](https://anthropic.com) | Pay-as-you-go | AI chatbot |
| BrightData (optional) | $30–80/mo | Proxy rotation for crawler |

**Total MVP cost: ~$50–120/month**

---

## Deploying to Vercel

```bash
cd real-estate-app
npx vercel
```

Set these environment variables in the Vercel dashboard:
- `DATABASE_URL`
- `ANTHROPIC_API_KEY`

---

## Development

```bash
# DB schema changes
npx prisma db push          # apply schema changes
npx prisma studio           # visual DB browser
npx prisma generate         # regenerate client after schema changes

# Crawler
cd nadlan-crawler
node crawler.js --dry-run   # test without DB
node crawler.js --city 5000 --pages 5  # seed Tel Aviv
```

---

## Legal Note

nadlan.gov.il data is public government data. Scraping it is legally accepted in Israel.
Do not scrape private real estate sites (yad2, madlan) without checking their Terms of Service.

---

## Disclaimer

המידע המוצג באתר מבוסס על עסקאות שדווחו לרשות המסים בישראל ומיועד לצרכי למידה בלבד.
הוא אינו מהווה ייעוץ השקעות, ייעוץ פיננסי, או ייעוץ משפטי.
