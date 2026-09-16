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
  'Zenith Jode Peptide ZJ',
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

export const vendorData: VendorRow[] = Array.from({ length: 100 }, (_, i) => {
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
})
