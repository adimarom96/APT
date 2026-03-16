export interface MortgageInput {
  price: number;
  equity: number;
  annualRate: number;  // e.g. 5.5 for 5.5%
  years: number;
}

export interface MortgageResult {
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
  principal: number;
  ltv: number;           // loan-to-value %
  equityPercent: number;
}

export function calcMortgage({ price, equity, annualRate, years }: MortgageInput): MortgageResult {
  const principal = price - equity;
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = principal / n;
  } else {
    monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
      (Math.pow(1 + monthlyRate, n) - 1);
  }

  const totalCost = monthlyPayment * n;
  const totalInterest = totalCost - principal;
  const ltv = Math.round((principal / price) * 100);
  const equityPercent = 100 - ltv;

  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalCost: Math.round(totalCost),
    totalInterest: Math.round(totalInterest),
    principal: Math.round(principal),
    ltv,
    equityPercent,
  };
}
