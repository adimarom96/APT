/**
 * Israeli Purchase Tax (מס רכישה) calculator
 * Rates as of 2024 — verify at https://taxes.gov.il before shipping
 *
 * For investors (not first home):
 *   0 – 6,055,070 ILS: 8%
 *   Above 6,055,070 ILS: 10%
 *
 * For first-home buyers (simplified brackets — update annually):
 *   0 – 1,978,745 ILS: 0%
 *   1,978,745 – 2,347,495 ILS: 3.5%
 *   2,347,495 – 6,055,070 ILS: 5%
 *   Above 6,055,070 ILS: 10%
 */

export interface TaxResult {
  purchaseTax: number;
  effectiveRate: number;  // %
  breakdown: Array<{ upTo: number | null; rate: number; amount: number }>;
}

const INVESTOR_BRACKETS = [
  { upTo: 6_055_070, rate: 0.08 },
  { upTo: null,      rate: 0.10 },
];

const FIRST_HOME_BRACKETS = [
  { upTo: 1_978_745, rate: 0.00 },
  { upTo: 2_347_495, rate: 0.035 },
  { upTo: 6_055_070, rate: 0.05 },
  { upTo: null,      rate: 0.10 },
];

function applyBrackets(
  price: number,
  brackets: Array<{ upTo: number | null; rate: number }>
): TaxResult {
  let remaining = price;
  let prevThreshold = 0;
  let total = 0;
  const breakdown = [];

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const threshold = bracket.upTo ?? Infinity;
    const taxable = Math.min(remaining, threshold - prevThreshold);
    const amount = taxable * bracket.rate;
    total += amount;
    breakdown.push({ upTo: bracket.upTo, rate: bracket.rate * 100, amount: Math.round(amount) });
    remaining -= taxable;
    prevThreshold = threshold === Infinity ? prevThreshold : threshold;
  }

  return {
    purchaseTax: Math.round(total),
    effectiveRate: Math.round((total / price) * 10000) / 100,
    breakdown,
  };
}

export function calcPurchaseTax(price: number, isFirstHome = false): TaxResult {
  const brackets = isFirstHome ? FIRST_HOME_BRACKETS : INVESTOR_BRACKETS;
  return applyBrackets(price, brackets);
}

export function formatILS(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}
