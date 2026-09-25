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

  if (loading) {
    return (
      <div className="full-leaderboard">
        <div className="fl-inner">
          <div className="fl-loading">
            <span className="fl-spinner" role="status" aria-label="Loading" />
            <span>Loading product data…</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !leaderboard || !testsData) {
    return (
      <div className="full-leaderboard">
        <div className="fl-inner">
          <div className="fl-error">{error || 'Product not found.'}</div>
        </div>
      </div>
    )
  }

  const { product, methodology, vendors } = leaderboard

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
          <div className="fl-methodology-desktop">
            <MethodologyBadge
              type={methodology.type}
              purityThreshold={methodology.purityThreshold}
              doseTolerance={methodology.doseTolerance}
            />
          </div>
        </div>

        <div className="fl-methodology-mobile">
          <MethodologyBadge
            type={methodology.type}
            purityThreshold={methodology.purityThreshold}
            doseTolerance={methodology.doseTolerance}
          />
        </div>

        <VendorsPanel vendors={vendors} />

        <TestHistorySection
          productName={product.name}
          stats={testsData.stats}
          tests={testsData.tests}
        />
      </div>
    </div>
  )
}
