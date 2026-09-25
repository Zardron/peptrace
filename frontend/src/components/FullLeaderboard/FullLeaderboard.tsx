import { useEffect, useState } from 'react'
import './FullLeaderboard.css'
import Breadcrumbs from './Breadcrumbs'
import ProductHeader from './ProductHeader'
import MethodologyBadge from './MethodologyBadge'
import VendorsPanel from './VendorsPanel'
import TestHistorySection from './TestHistorySection'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

interface Product {
  name: string
  slug: string
  vendorCount: number
  testCount: number
  firstTestDate: string
  latestTestDate: string
}

interface Methodology {
  type: string
  purityThreshold: string
  doseTolerance: string
}

interface Vendor {
  rank: number
  name: string
  slug: string
  initials: string
  isVerified: boolean
  pricePerMg: number
  customerRating: number
  purityRating: number
  nCount: number
}

interface TestStats {
  total: number
  pass: number
  fail: number
}

interface TestItem {
  date: string
  result: 'PASS' | 'FAIL'
  productName: string
  vendorName: string
  labName: string
  purity: number | null
  identityPass: boolean
  dosageDeviation: string | null
  testedMg: number | null
  labelMg: number | null
  batch: string
  sender: string
  coaUrl: string | null
}

interface LeaderboardData {
  product: Product
  methodology: Methodology
  vendors: Vendor[]
}

interface TestsData {
  stats: TestStats
  tests: TestItem[]
}

interface FullLeaderboardProps {
  slug: string
}

const DEFAULT_PRODUCT: Product = {
  name: 'Retatrutide',
  slug: 'retatrutide',
  vendorCount: 293,
  testCount: 3858,
  firstTestDate: '2025-12-17',
  latestTestDate: '2026-09-20',
}

const DEFAULT_METHODOLOGY: Methodology = {
  type: 'Purity Focused',
  purityThreshold: 'purity 99.5%+',
  doseTolerance: 'dose ±35%',
}

const DEFAULT_STATS: TestStats = {
  total: 18,
  pass: 17,
  fail: 1,
}

const DEFAULT_VENDORS: Vendor[] = [
  { rank: 1, name: 'Peptide Partners', slug: 'peptide-partners', initials: 'PP', isVerified: true, pricePerMg: 1.45, customerRating: 4.9, purityRating: 93, nCount: 142 },
  { rank: 2, name: 'Inno Peptides', slug: 'inno-peptides', initials: 'IP', isVerified: true, pricePerMg: 1.52, customerRating: 4.8, purityRating: 91, nCount: 128 },
  { rank: 3, name: 'ZLZ Peptide', slug: 'zlz-peptide', initials: 'ZL', isVerified: true, pricePerMg: 1.58, customerRating: 4.7, purityRating: 91, nCount: 115 },
  { rank: 4, name: 'Bioscience Lab', slug: 'bioscience-lab', initials: 'BL', isVerified: false, pricePerMg: 1.65, customerRating: 4.6, purityRating: 89, nCount: 89 },
  { rank: 5, name: 'PureCycle', slug: 'purecycle', initials: 'PC', isVerified: false, pricePerMg: 1.72, customerRating: 4.5, purityRating: 88, nCount: 76 },
  { rank: 6, name: 'Synthetix', slug: 'synthetix', initials: 'SX', isVerified: false, pricePerMg: 1.80, customerRating: 4.4, purityRating: 86, nCount: 64 },
  { rank: 7, name: 'NovaChem', slug: 'novachem', initials: 'NC', isVerified: false, pricePerMg: 1.85, customerRating: 4.3, purityRating: 85, nCount: 58 },
  { rank: 8, name: 'GenTech', slug: 'gentech', initials: 'GT', isVerified: false, pricePerMg: 1.90, customerRating: 4.2, purityRating: 84, nCount: 52 },
]

const DEFAULT_TESTS: TestItem[] = [
  { date: '2026-08-03', result: 'PASS', productName: 'Retatrutide', vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.9, identityPass: true, dosageDeviation: '-15%', testedMg: 34, labelMg: 40, batch: 'Batch March 7, 2026', sender: 'sent by Public', coaUrl: '#' },
  { date: '2026-07-30', result: 'PASS', productName: 'Retatrutide', vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.8, identityPass: true, dosageDeviation: '+6%', testedMg: 21.2, labelMg: 20, batch: 'Batch 258014', sender: 'sent by Public', coaUrl: '#' },
  { date: '2025-07-13', result: 'FAIL', productName: 'Retatrutide', vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.2, identityPass: true, dosageDeviation: '+8%', testedMg: 10.8, labelMg: 10, batch: 'No label / Copper crimp / Clear cap', sender: 'sent by Public', coaUrl: '#' },
  { date: '2025-07-13', result: 'PASS', productName: 'Retatrutide', vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.9, identityPass: true, dosageDeviation: '-19%', testedMg: 40.7, labelMg: 50, batch: 'Batch May 6, 2025', sender: 'sent by Public', coaUrl: '#' },
  { date: '2025-06-08', result: 'PASS', productName: 'Retatrutide', vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.8, identityPass: true, dosageDeviation: '+1%', testedMg: 30.4, labelMg: 30, batch: 'Batch March 6, 2025', sender: 'sent by Public', coaUrl: '#' },
  { date: '2025-06-02', result: 'PASS', productName: 'Retatrutide', vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.9, identityPass: true, dosageDeviation: '-2%', testedMg: 9.79, labelMg: 10, batch: 'Batch 258013', sender: 'sent by Public', coaUrl: '#' },
  { date: '2025-04-02', result: 'PASS', productName: 'Retatrutide', vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.6, identityPass: true, dosageDeviation: '+2%', testedMg: 20.4, labelMg: 20, batch: 'Batch Feb 5, 2025', sender: 'sent by Public', coaUrl: '#' },
  { date: '2025-03-07', result: 'PASS', productName: 'Retatrutide', vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.8, identityPass: true, dosageDeviation: '+9%', testedMg: 21.7, labelMg: 20, batch: 'Batch 021525', sender: 'sent by Public', coaUrl: '#' },
  { date: '2025-03-02', result: 'PASS', productName: 'Retatrutide', vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.9, identityPass: true, dosageDeviation: '-12%', testedMg: 88.2, labelMg: 100, batch: 'Batch Jan 2, 2025', sender: 'sent by Public', coaUrl: '#' },
  { date: '2025-02-18', result: 'PASS', productName: 'Retatrutide', vendorName: 'Zenith Jode Peptide', labName: 'LAB NAME', purity: 99.9, identityPass: true, dosageDeviation: '-12%', testedMg: 17.6, labelMg: 20, batch: 'No Label / Gold Crimp / Clear Cap', sender: 'sent by Public', coaUrl: '#' },
]

export default function FullLeaderboard({ slug }: FullLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [testsData, setTestsData] = useState<TestsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      fetch(`${API_BASE}/products/${encodeURIComponent(slug)}/leaderboard`).then((res) => {
        if (!res.ok) throw new Error('Failed to load leaderboard')
        return res.json()
      }),
      fetch(`${API_BASE}/products/${encodeURIComponent(slug)}/tests`).then((res) => {
        if (!res.ok) throw new Error('Failed to load tests')
        return res.json()
      }),
    ])
      .then(([lb, td]) => {
        if (cancelled) return
        setLeaderboard(lb)
        setTestsData(td)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Could not load product data. Please try again later.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const product = leaderboard?.product ?? DEFAULT_PRODUCT
  const methodology = leaderboard?.methodology ?? DEFAULT_METHODOLOGY
  const vendors = leaderboard?.vendors ?? DEFAULT_VENDORS
  const stats = testsData?.stats ?? DEFAULT_STATS
  const tests = testsData?.tests ?? DEFAULT_TESTS

  return (
    <div className="full-leaderboard">
      <div className="fl-inner">
        <Breadcrumbs productName={product.name} />

        <div className="fl-header-row">
          <ProductHeader
            name={product.name}
            methodology={methodology.type}
            vendorCount={product.vendorCount}
            testCount={product.testCount}
            firstTestDate={product.firstTestDate}
            latestTestDate={product.latestTestDate}
          />
        </div>

        <div className="fl-methodology-desktop methodology-badge-wrapper">
          <MethodologyBadge
            type={methodology.type}
            purityThreshold={methodology.purityThreshold}
            doseTolerance={methodology.doseTolerance}
          />
        </div>

        <div className="fl-methodology-mobile">
          <MethodologyBadge
            type={methodology.type}
            purityThreshold={methodology.purityThreshold}
            doseTolerance={methodology.doseTolerance}
          />
        </div>

        <VendorsPanel
          vendors={vendors}
          loading={loading}
          error={error}
        />

        <TestHistorySection
          productName={product.name}
          stats={stats}
          tests={tests}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  )
}
