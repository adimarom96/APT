import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const cities = await prisma.deal.groupBy({
      by: ['cityName'],
      _count: { id: true },
      _avg: { pricePerSqm: true },
      where: {
        cityName: { not: null },
        dealDate: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        pricePerSqm: { gt: 0 },
      },
      orderBy: { _count: { id: 'desc' } },
    });

    const result = cities
      .filter(c => c.cityName)
      .map(c => ({
        name: c.cityName!,
        dealCount: c._count.id,
        avgPricePerSqm: c._avg.pricePerSqm
          ? Math.round(Number(c._avg.pricePerSqm))
          : null,
      }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('/api/cities error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
