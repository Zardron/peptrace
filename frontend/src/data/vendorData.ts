export interface VendorRow {
  id: string
  name: string
  score: number
  cost: string
  tests: number
  products: number
  latest: string
  location: string
}

const locations = [
  'China',
  'US',
  'UK',
  'Germany',
  'Hong Kong',
  'Japan',
  'India',
  'Canada',
  'Australia',
  '—',
]

const vendorNames = [
  'Zenith Jode Pep',
  'Peptide Partners',
  'AlphaPeptides',
  'BioSynth Labs',
  'ChemPure Supply',
  'Delta Peptides',
  'Elite Research Chems',
  'Fusion Biologics',
  'GenX Peptides',
  'Helix BioTech',
]

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

function formatDate(seed: number): string {
  const daysAgo = Math.floor(seededRandom(seed) * 730)
  const date = new Date('2026-08-08')
  date.setDate(date.getDate() - daysAgo)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCost(seed: number): string {
  const base = 0.5 + seededRandom(seed) * 5.5
  return `$${base.toFixed(2)}/mg`
}

function generateRow(i: number): VendorRow {
  const seed = i + 1
  const name =
    i === 0
      ? vendorNames[0]
      : `${vendorNames[1 + Math.floor(seededRandom(seed * 3) * (vendorNames.length - 1))]}`
  const score = Math.max(58, Math.round(92 - seededRandom(seed * 7) * 40))
  return {
    id: String(seed),
    name,
    score,
    cost: formatCost(seed * 11),
    tests: Math.floor(5 + seededRandom(seed * 13) * 45),
    products: Math.floor(1 + seededRandom(seed * 17) * 5),
    latest: formatDate(seed * 19),
    location: locations[Math.floor(seededRandom(seed * 23) * locations.length)],
  }
}

const topRows: VendorRow[] = [
  { id: '1', name: 'Zenith Jode Pep', score: 92, cost: '$1.00/mg', tests: 18, products: 2, latest: '8 Aug 2026', location: 'China' },
  { id: '2', name: 'Peptide Partners', score: 85, cost: '$0.70/mg', tests: 16, products: 2, latest: '8 Aug 2026', location: '—' },
  { id: '3', name: 'Peptide Partners', score: 82, cost: '$1.00/mg', tests: 20, products: 2, latest: '5 Aug 2025', location: '—' },
  { id: '4', name: 'Peptide Partners', score: 79, cost: '$0.60/mg', tests: 46, products: 2, latest: '4 Aug 2025', location: '—' },
  { id: '5', name: 'Peptide Partners', score: 78, cost: '$0.60/mg', tests: 19, products: 2, latest: '4 Aug 2025', location: 'US' },
  { id: '6', name: 'Peptide Partners', score: 75, cost: '$1.27/mg', tests: 13, products: 1, latest: '30 Jul 2025', location: 'US' },
  { id: '7', name: 'Peptide Partners', score: 72, cost: '$1.40/mg', tests: 8, products: 1, latest: '27 Jul 2025', location: 'China' },
  { id: '8', name: 'Peptide Partners', score: 69, cost: '$1.50/mg', tests: 16, products: 2, latest: '20 Apr 2025', location: 'China' },
  { id: '9', name: 'Peptide Partners', score: 62, cost: '$5.50/mg', tests: 10, products: 2, latest: '20 Apr 2025', location: 'US' },
  { id: '10', name: 'Peptide Partners', score: 58, cost: '$5.00/mg', tests: 9, products: 1, latest: '8 May 2025', location: '—' },
]

export const vendorData: VendorRow[] = [
  ...topRows,
  ...Array.from({ length: 90 }, (_, i) => generateRow(i + 10)),
]
