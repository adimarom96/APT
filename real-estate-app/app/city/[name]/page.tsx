import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { StatCard } from '@/components/StatCard';
import { PriceTrendChart } from '@/components/PriceTrendChart';
import { RoomDistributionChart } from '@/components/RoomDistributionChart';
import { DealsTable } from '@/components/DealsTable';
import { YieldCalculator } from '@/components/YieldCalculator';
import Link from 'next/link';

interface PageProps {
  params: { name: string };
}

async function getCityStats(cityName: string) {
  const since12Months = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const since5Years = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);

  const [summary, history, byRooms, recentDeals] = await Promise.all([
    // Summary stats
    prisma.deal.aggregate({
      where: {
        cityName,
        pricePerSqm: { gt: 0 },
        dealDate: { gte: since12Months },
        assetType: { contains: 'דירה' },
      },
      _avg: { pricePerSqm: true, dealAmount: true },
      _count: { id: true },
    }),

    // Price history
    prisma.$queryRaw<Array<{ month: Date; avg_price_sqm: number; deals: bigint }>>`
      SELECT
        DATE_TRUNC('month', deal_date) AS month,
        ROUND(AVG(price_per_sqm))::int  AS avg_price_sqm,
        COUNT(*)                        AS deals
      FROM deals
      WHERE city_name = ${cityName}
        AND deal_date >= ${since5Years}
        AND price_per_sqm > 0
        AND asset_type ILIKE '%דירה%'
      GROUP BY month
      ORDER BY month ASC
    `,

    // By rooms
    prisma.$queryRaw<Array<{ rooms: number; deals: bigint; avg_price: number; avg_price_sqm: number }>>`
      SELECT
        rooms,
        COUNT(*)                         AS deals,
        ROUND(AVG(deal_amount))::bigint  AS avg_price,
        ROUND(AVG(price_per_sqm))::int   AS avg_price_sqm
      FROM deals
      WHERE city_name = ${cityName}
        AND deal_date >= ${since12Months}
        AND price_per_sqm > 0
        AND asset_type ILIKE '%דירה%'
        AND rooms IS NOT NULL
      GROUP BY rooms
      ORDER BY rooms ASC
    `,

    // Recent 50 deals
    prisma.deal.findMany({
      where: { cityName, dealAmount: { gt: BigInt(0) } },
      orderBy: { dealDatetime: 'desc' },
      take: 50,
      select: {
        id: true,
        fullAddress: true,
        rooms: true,
        floor: true,
        buildingFloors: true,
        areaSqm: true,
        dealAmount: true,
        pricePerSqm: true,
        dealDate: true,
        assetType: true,
        isNewProject: true,
      },
    }),
  ]);

  return { summary, history, byRooms, recentDeals };
}

export default async function CityPage({ params }: PageProps) {
  const cityName = decodeURIComponent(params.name);

  let data;
  try {
    data = await getCityStats(cityName);
  } catch {
    // DB not connected yet
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-2">לא ניתן להתחבר למסד הנתונים.</p>
        <p className="text-sm text-gray-400">
          ודא ש-DATABASE_URL מוגדר ב-.env.local
        </p>
      </div>
    );
  }

  if (!data || data.summary._count.id === 0) {
    notFound();
  }

  const { summary, history, byRooms, recentDeals } = data;

  const avgPricePerSqm = summary._avg.pricePerSqm
    ? Math.round(Number(summary._avg.pricePerSqm))
    : null;
  const avgDealAmount = summary._avg.dealAmount
    ? Math.round(Number(summary._avg.dealAmount))
    : null;

  const priceHistory = history.map(r => ({
    month: r.month instanceof Date ? r.month.toISOString().split('T')[0] : String(r.month),
    avgPricePerSqm: Number(r.avg_price_sqm),
    deals: Number(r.deals),
  }));

  const byRoomsData = byRooms.map(r => ({
    rooms: Number(r.rooms),
    deals: Number(r.deals),
    avgPrice: Number(r.avg_price),
    avgPricePerSqm: Number(r.avg_price_sqm),
  }));

  const serializedDeals = recentDeals.map(d => ({
    ...d,
    dealAmount: d.dealAmount?.toString() ?? null,
    pricePerSqm: d.pricePerSqm ? Number(d.pricePerSqm) : null,
    rooms: d.rooms ? Number(d.rooms) : null,
    areaSqm: d.areaSqm ? Number(d.areaSqm) : null,
    dealDate: d.dealDate?.toISOString().split('T')[0] ?? null,
  }));

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-brand-600">ראשי</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">{cityName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">{cityName}</h1>
          <p className="text-gray-500 mt-1">נתוני שוק על בסיס עסקאות שדווחו לרשות המסים</p>
        </div>
        <Link
          href={`/compare?cities=${encodeURIComponent(cityName)}`}
          className="text-sm text-brand-600 hover:text-brand-800 border border-brand-200 rounded-lg px-4 py-2 hover:bg-brand-50 transition-colors"
        >
          השווה לעיר אחרת →
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label='מחיר ממוצע למ"ר (12 חודשים)'
          value={avgPricePerSqm}
          unit="₪"
        />
        <StatCard
          label="מחיר ממוצע לדירה"
          value={avgDealAmount}
          unit="₪"
        />
        <StatCard
          label="עסקאות (12 חודשים)"
          value={summary._count.id}
        />
        <StatCard
          label="נקודות נתונים (5 שנים)"
          value={priceHistory.reduce((s, r) => s + r.deals, 0)}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            מגמת מחיר למ"ר — 5 שנים אחרונות
          </h2>
          <PriceTrendChart data={priceHistory} cityName={cityName} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            מחיר ממוצע לפי מספר חדרים
          </h2>
          <RoomDistributionChart data={byRoomsData} metric="avgPricePerSqm" />
        </div>
      </div>

      {/* Yield calculator embedded */}
      <div className="mb-10">
        <YieldCalculator defaultPrice={avgDealAmount ?? 1_500_000} />
      </div>

      {/* Recent deals */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">50 עסקאות אחרונות</h2>
        <DealsTable deals={serializedDeals} />
      </div>
    </div>
  );
}

export function generateMetadata({ params }: PageProps) {
  const cityName = decodeURIComponent(params.name);
  return {
    title: `${cityName} — נתוני נדל"ן`,
    description: `מחירי דירות, תשואה ונתוני שוק ב${cityName}`,
  };
}
