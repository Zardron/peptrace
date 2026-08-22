export interface LeaderboardRow {
  rank: number;
  vendorName: string;
  pricePerMg: string;
  rating: string;
}

export interface LeaderboardCardData {
  productName: string;
  testCount: string;
  vendorCount: string;
  lastUpdated: string;
  ctaText: string;
  ctaHref: string;
  rows: LeaderboardRow[];
  totalVendors: string;
}

export const leaderboardCards: LeaderboardCardData[] = [
  {
    productName: 'Retatrutide',
    testCount: '2,459 tests',
    vendorCount: '212 vendors',
    lastUpdated: 'Updated Aug 2026',
    ctaText: 'Submit your Retatrutide for free testing',
    ctaHref: '/test/retatrutide',
    rows: [
      { rank: 1, vendorName: 'Zenith Jode Peptide ZJ', pricePerMg: '$0.95', rating: '92%' },
      { rank: 2, vendorName: 'Peptide Partners', pricePerMg: '$4.85', rating: '91%' },
      { rank: 3, vendorName: 'Alpha Peptide Labs', pricePerMg: '$1.20', rating: '89%' },
      { rank: 4, vendorName: 'Core Research Supply', pricePerMg: '$0.85', rating: '88%' },
    ],
    totalVendors: '212 Vendors',
  },
  {
    productName: 'Tirzepatide',
    testCount: '1,832 tests',
    vendorCount: '198 vendors',
    lastUpdated: 'Updated Aug 2026',
    ctaText: 'Submit your Tirzepatide for free testing',
    ctaHref: '/test/tirzepatide',
    rows: [
      { rank: 1, vendorName: 'Zenith Jode Peptide ZJ', pricePerMg: '$1.05', rating: '93%' },
      { rank: 2, vendorName: 'Peptide Partners', pricePerMg: '$4.95', rating: '90%' },
      { rank: 3, vendorName: 'Alpha Peptide Labs', pricePerMg: '$1.35', rating: '87%' },
      { rank: 4, vendorName: 'Core Research Supply', pricePerMg: '$0.92', rating: '86%' },
    ],
    totalVendors: '198 Vendors',
  },
  {
    productName: 'BPC-157',
    testCount: '3,104 tests',
    vendorCount: '245 vendors',
    lastUpdated: 'Updated Aug 2026',
    ctaText: 'Submit your BPC-157 for free testing',
    ctaHref: '/test/bpc-157',
    rows: [
      { rank: 1, vendorName: 'Zenith Jode Peptide ZJ', pricePerMg: '$0.75', rating: '94%' },
      { rank: 2, vendorName: 'Peptide Partners', pricePerMg: '$3.85', rating: '92%' },
      { rank: 3, vendorName: 'Alpha Peptide Labs', pricePerMg: '$0.95', rating: '90%' },
      { rank: 4, vendorName: 'Core Research Supply', pricePerMg: '$0.65', rating: '89%' },
    ],
    totalVendors: '245 Vendors',
  },
  {
    productName: 'Ipamorelin',
    testCount: '1,456 tests',
    vendorCount: '167 vendors',
    lastUpdated: 'Updated Aug 2026',
    ctaText: 'Submit your Ipamorelin for free testing',
    ctaHref: '/test/ipamorelin',
    rows: [
      { rank: 1, vendorName: 'Zenith Jode Peptide ZJ', pricePerMg: '$0.55', rating: '91%' },
      { rank: 2, vendorName: 'Peptide Partners', pricePerMg: '$2.95', rating: '89%' },
      { rank: 3, vendorName: 'Alpha Peptide Labs', pricePerMg: '$0.80', rating: '88%' },
      { rank: 4, vendorName: 'Core Research Supply', pricePerMg: '$0.48', rating: '87%' },
    ],
    totalVendors: '167 Vendors',
  },
];
