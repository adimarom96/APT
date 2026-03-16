import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city = searchParams.get('city');
  const roomsParam = searchParams.get('rooms');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

  if (!city) {
    return NextResponse.json({ error: 'city param required' }, { status: 400 });
  }

  try {
    const where = {
      cityName: city,
      ...(roomsParam ? { rooms: { equals: parseFloat(roomsParam) } } : {}),
      dealAmount: { gt: BigInt(0) },
    };

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        orderBy: { dealDatetime: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
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
          projectName: true,
        },
      }),
      prisma.deal.count({ where }),
    ]);

    const serialized = deals.map(d => ({
      ...d,
      dealAmount: d.dealAmount?.toString() ?? null,
      pricePerSqm: d.pricePerSqm ? Number(d.pricePerSqm) : null,
      rooms: d.rooms ? Number(d.rooms) : null,
      areaSqm: d.areaSqm ? Number(d.areaSqm) : null,
      dealDate: d.dealDate?.toISOString().split('T')[0] ?? null,
    }));

    return NextResponse.json({
      deals: serialized,
      total,
      page,
      pages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error('/api/deals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
