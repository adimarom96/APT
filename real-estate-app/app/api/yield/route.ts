import { NextRequest, NextResponse } from 'next/server';
import { calcYield } from '@/lib/yield';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const price = parseFloat(searchParams.get('price') || '0');
  const rent = parseFloat(searchParams.get('rent') || '0');
  const expenses = parseFloat(searchParams.get('expenses') || '0');

  if (!price || price <= 0) {
    return NextResponse.json({ error: 'price param required and must be > 0' }, { status: 400 });
  }
  if (!rent || rent <= 0) {
    return NextResponse.json({ error: 'rent param required and must be > 0' }, { status: 400 });
  }

  const result = calcYield({
    purchasePrice: price,
    monthlyRent: rent,
    monthlyExpenses: expenses,
  });

  return NextResponse.json(result);
}
