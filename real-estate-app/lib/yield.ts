export interface YieldInput {
  purchasePrice: number;
  monthlyRent: number;
  monthlyExpenses?: number;
}

export interface YieldResult {
  grossYield: number;       // %
  netYield: number;         // %
  breakEvenYears: number;
  annualRent: number;
  annualExpenses: number;
  annualNetIncome: number;
}

export function calcYield({ purchasePrice, monthlyRent, monthlyExpenses = 0 }: YieldInput): YieldResult {
  const annualRent = monthlyRent * 12;
  const annualExpenses = monthlyExpenses * 12;
  const annualNetIncome = annualRent - annualExpenses;

  const grossYield = (annualRent / purchasePrice) * 100;
  const netYield = (annualNetIncome / purchasePrice) * 100;
  const breakEvenYears = annualNetIncome > 0 ? purchasePrice / annualNetIncome : Infinity;

  return {
    grossYield: Math.round(grossYield * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    breakEvenYears: Math.round(breakEvenYears * 10) / 10,
    annualRent,
    annualExpenses,
    annualNetIncome,
  };
}
