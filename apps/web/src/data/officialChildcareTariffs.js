export const milanMunicipalChildcareTariffs2025_2026 = {
  label: 'Comune di Milano contributive quote 2025/2026 PDF',
  url:
    'https://www.comune.milano.it/documents/20118/1073744/2025-2026+Informazioni+quote+contributive+Nidi+e+Sezioni+Primavera.pdf/43e92661-59f6-c8aa-fd84-5a488891e4e0?version=1.0&t=1760368643025&download=true',
  verifiedAt: 'Comune di Milano PDF dated 1 Jul 2025 for educational year 2025/2026',
  registrationFee: 'EUR56.20',
  nido: {
    residentBands: [
      { iseeBand: 'EUR0.00-EUR6,500.00', monthly: 'free' },
      { iseeBand: 'EUR6,500.01-EUR12,500.00', monthly: 'EUR111.30' },
      { iseeBand: 'EUR12,500.01-EUR27,000.00', monthly: 'EUR250.60' },
      { iseeBand: 'Above EUR27,000.00 or without ISEE', monthly: 'EUR502.20' },
    ],
    nonResidentMonthly: 'EUR669.35',
  },
  sezionePrimavera: {
    residentBands: [
      { iseeBand: 'EUR0.00-EUR6,500.00', monthly: 'free' },
      { iseeBand: 'EUR6,500.01-EUR12,500.00', monthly: 'EUR55.65' },
      { iseeBand: 'EUR12,500.01-EUR27,000.00', monthly: 'EUR125.30' },
      { iseeBand: 'Above EUR27,000.00 or without ISEE', monthly: 'EUR251.10' },
    ],
    nonResidentMonthly: 'EUR334.68',
  },
  reductions: [
    '50% of the assigned fee for low attendance of 5 days or fewer in the month and for December.',
    '30% of the assigned fee for the second sibling, then EUR56.20/month for each sibling after the second.',
    '50% of the assigned fee for a child in pre-adoptive foster care.',
    '10% reduction on the total due for a single advance payment.',
  ],
};

export const officialChildcareTariffs = {
  milan: milanMunicipalChildcareTariffs2025_2026,
};