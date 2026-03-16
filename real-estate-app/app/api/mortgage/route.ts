import { NextRequest, NextResponse } from 'next/server';
import { calcMortgage } from '@/lib/mortgage';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const price = parseFloat(searchParams.get('price') || '0');
  const equity = parseFloat(searchParams.get('equity') || '0');
  const rate = parseFloat(searchParams.get('rate') || '5.5');
  const years = parseInt(searchParams.get('years') || '25');

  if (!price || price <= 0) {
    return NextResponse.json({ error: 'price param required and must be > 0' }, { status: 400 });
  }
  if (equity < 0 || equity >= price) {
    return NextResponse.json({ error: 'equity must be >= 0 and < price' }, { status: 400 });
  }

  const result = calcMortgage({ price, equity, annualRate: rate, years });
  return NextResponse.json(result);
}
