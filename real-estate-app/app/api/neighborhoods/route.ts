import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ error: 'city param required' }, { status: 400 });
  }

  try {
    const since12Months = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const neighborhoods = await prisma.$queryRaw<
      Array<{
        polygon_id: string;
        deal_count: bigint;
        avg_price_sqm: number;
        avg_deal_amount: number;
        sample_address: string;
      }>
    >`
      SELECT
        polygon_id,
        COUNT(*)                        AS deal_count,
        ROUND(AVG(price_per_sqm))::int  AS avg_price_sqm,
        ROUND(AVG(deal_amount))::bigint AS avg_deal_amount,
        MIN(full_address)               AS sample_address
      FROM deals
      WHERE city_name = ${city}
        AND deal_date >= ${since12Months}
        AND price_per_sqm > 0
        AND polygon_id IS NOT NULL
      GROUP BY polygon_id
      ORDER BY deal_count DESC
      LIMIT 30
    `;

    return NextResponse.json(
      neighborhoods.map(n => ({
        polygonId: n.polygon_id,
        dealCount: Number(n.deal_count),
        avgPricePerSqm: Number(n.avg_price_sqm),
        avgDealAmount: Number(n.avg_deal_amount),
        sampleAddress: n.sample_address,
      }))
    );
  } catch (err) {
    console.error('/api/neighborhoods error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
