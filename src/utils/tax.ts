// Sri Lankan Tax Rules (YA 2025/2026)

export interface TaxResult {
  taxableIncome: number;
  taxLiability: number;
  slabs: { rate: number; amount: number; tax: number }[];
  effectiveRate: number;
}

export function calculatePersonalTax(annualIncome: number): TaxResult {
  const RELIEF = 1800000; // 1.8M Annual Relief
  
  let taxableIncome = Math.max(0, annualIncome - RELIEF);
  let taxLiability = 0;
  const slabs: { rate: number; amount: number; tax: number }[] = [];

  let remainingIncome = taxableIncome;

  // Slab 1: First 1,000,000 @ 6%
  if (remainingIncome > 0) {
    const amount = Math.min(remainingIncome, 1000000);
    const tax = amount * 0.06;
    slabs.push({ rate: 6, amount, tax });
    taxLiability += tax;
    remainingIncome -= amount;
  }

  // Slab 2: Next 500,000 @ 18%
  if (remainingIncome > 0) {
    const amount = Math.min(remainingIncome, 500000);
    const tax = amount * 0.18;
    slabs.push({ rate: 18, amount, tax });
    taxLiability += tax;
    remainingIncome -= amount;
  }

  // Slab 3: Next 500,000 @ 24%
  if (remainingIncome > 0) {
    const amount = Math.min(remainingIncome, 500000);
    const tax = amount * 0.24;
    slabs.push({ rate: 24, amount, tax });
    taxLiability += tax;
    remainingIncome -= amount;
  }

  // Slab 4: Next 500,000 @ 30%
  if (remainingIncome > 0) {
    const amount = Math.min(remainingIncome, 500000);
    const tax = amount * 0.30;
    slabs.push({ rate: 30, amount, tax });
    taxLiability += tax;
    remainingIncome -= amount;
  }

  // Slab 5: Balance @ 36%
  if (remainingIncome > 0) {
    const amount = remainingIncome;
    const tax = amount * 0.36;
    slabs.push({ rate: 36, amount, tax });
    taxLiability += tax;
    remainingIncome -= amount;
  }

  return {
    taxableIncome,
    taxLiability,
    slabs,
    effectiveRate: annualIncome > 0 ? (taxLiability / annualIncome) * 100 : 0
  };
}

export const TAX_CALENDAR = [
  { event: '1st Installment Due', date: 'August 15', description: '25% of estimated tax' },
  { event: '2nd Installment Due', date: 'November 15', description: '25% of estimated tax' },
  { event: '3rd Installment Due', date: 'February 15', description: '25% of estimated tax' },
  { event: '4th Installment Due', date: 'May 15', description: 'Final installment' },
  { event: 'Annual Return Filing', date: 'November 30', description: 'Final deadline for YA' }
];

export function calculateInstallments(totalTax: number) {
  const installment = totalTax / 4;
  return [
    { period: '1st (Aug 15)', amount: installment },
    { period: '2nd (Nov 15)', amount: installment },
    { period: '3rd (Feb 15)', amount: installment },
    { period: '4th (May 15)', amount: installment },
  ];
}

export function calculateCorporateTax(netProfit: number, type: 'standard' | 'concessionary' | 'specialized'): number {
  switch (type) {
    case 'concessionary':
      return netProfit * 0.15;
    case 'specialized':
      return netProfit * 0.45;
    case 'standard':
    default:
      return netProfit * 0.30;
  }
}
