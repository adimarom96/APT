import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city = searchParams.get('city');
  const roomsParam = searchParams.get('rooms');

  if (!city) {
    return NextResponse.json({ error: 'city param required' }, { status: 400 });
  }

  const rooms = roomsParam ? parseFloat(roomsParam) : null;
  const since12Months = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const since5Years = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);

  const baseWhere = {
    cityName: city,
    pricePerSqm: { gt: 0 },
    assetType: { contains: 'דירה' },
    ...(rooms ? { rooms: { equals: rooms } } : {}),
  };

  try {
    // Summary stats (last 12 months)
    const [summaryRaw, historyRaw, byRoomsRaw] = await Promise.all([
      // 1. Summary
      prisma.deal.aggregate({
        where: { ...baseWhere, dealDate: { gte: since12Months } },
        _avg: { pricePerSqm: true, dealAmount: true },
        _count: { id: true },
        _min: { pricePerSqm: true },
        _max: { pricePerSqm: true },
      }),

      // 2. Price history (5 years, monthly)
      prisma.$queryRaw<Array<{ month: Date; avg_price_sqm: number; deals: bigint }>>`
        SELECT
          DATE_TRUNC('month', deal_date) AS month,
          ROUND(AVG(price_per_sqm))::int  AS avg_price_sqm,
          COUNT(*)                        AS deals
        FROM deals
        WHERE city_name = ${city}
          ${rooms ? prisma.$queryRaw`AND rooms = ${rooms}` : prisma.$queryRaw``}
          AND deal_date >= ${since5Years}
          AND price_per_sqm > 0
          AND asset_type ILIKE '%דירה%'
        GROUP BY month
        ORDER BY month ASC
      `,

      // 3. Average by room count (last 12 months)
      prisma.$queryRaw<Array<{ rooms: number; deals: bigint; avg_price: number; avg_price_sqm: number }>>`
        SELECT
          rooms,
          COUNT(*)                         AS deals,
          ROUND(AVG(deal_amount))::bigint  AS avg_price,
          ROUND(AVG(price_per_sqm))::int   AS avg_price_sqm
        FROM deals
        WHERE city_name = ${city}
          AND deal_date >= ${since12Months}
          AND price_per_sqm > 0
          AND asset_type ILIKE '%דירה%'
          AND rooms IS NOT NULL
        GROUP BY rooms
        ORDER BY rooms ASC
      `,
    ]);

    return NextResponse.json({
      summary: {
        avgPricePerSqm: summaryRaw._avg.pricePerSqm
          ? Math.round(Number(summaryRaw._avg.pricePerSqm))
          : null,
        avgDealAmount: summaryRaw._avg.dealAmount
          ? Math.round(Number(summaryRaw._avg.dealAmount))
          : null,
        dealCount: summaryRaw._count.id,
        minPricePerSqm: summaryRaw._min.pricePerSqm
          ? Math.round(Number(summaryRaw._min.pricePerSqm))
          : null,
        maxPricePerSqm: summaryRaw._max.pricePerSqm
          ? Math.round(Number(summaryRaw._max.pricePerSqm))
          : null,
      },
      priceHistory: historyRaw.map(r => ({
        month: r.month instanceof Date ? r.month.toISOString().split('T')[0] : String(r.month),
        avgPricePerSqm: Number(r.avg_price_sqm),
        deals: Number(r.deals),
      })),
      byRooms: byRoomsRaw.map(r => ({
        rooms: Number(r.rooms),
        deals: Number(r.deals),
        avgPrice: Number(r.avg_price),
        avgPricePerSqm: Number(r.avg_price_sqm),
      })),
    });
  } catch (err) {
    console.error('/api/stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
