import { useEffect, useMemo, useState } from 'react'
import StandardFilter, { getStandard, type StandardId } from '../StandardFilter/StandardFilter'
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faGlobe,
  faExternalLinkAlt,
  faFileLines,
  faMessage,
  faEnvelope,
  faCreditCard,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import './VendorDetails.css'
import { useMembership } from '../../lib/membership'
import { navigate } from '../../lib/navigation'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

interface VendorContact {
  type: 'website' | 'whatsapp' | 'email'
  value: string
  url: string
}

interface PeptideRow {
  id: string
  name: string
  pricePerMg: number | null
  rating: number | null
  averagePurity: number | null
  testCount: number
}

interface TrendPoint {
  date: string
  rating: number
  label: string | null
}

interface TestItem {
  date: string
  result: 'pass' | 'fail'
  peptideName: string
  vendorName: string
  labName: string
  purity: number | null
  dosageDeviation: string | null
  testedMg: number | null
  labelMg: number | null
  batchInfo: string | null
  sender: string | null
  coaUrl: string | null
}

interface VendorData {
  id: string
  name: string
  slug: string
  location: string
  websiteUrl: string
  avatarUrl: string | null
  testsCount: number
  peptidesCount: number
  latestUpdate: string | null
  rating: number | null
  rank: number | null
  rankedVendorsCount: number
  testsPassed: number
  testsTotal: number
  analysisText: string | null
  about: string | null
  correctionsCount: number
  corrections: unknown[]
  contactChannels: VendorContact[]
  intelligenceReport: {
    title: string
    description: string
    pageCount: number
    riskFactorsAssessed: number
    publishedDate: string
    previewUrl: string | null
  } | null
  peptides: PeptideRow[]
  rankingsByStandard?: Partial<Record<StandardId, { rank: number | null; rankedVendorsCount: number }>>
  ratingTrend: {
    bands: { label: string; threshold: number }[]
    points: TrendPoint[]
    xAxisLabels: string[]
  } | null
  testHistory: {
    total: number
    passCount: number
    failCount: number
    items: TestItem[]
    pagination: { page: number; pageSize: number; totalPages: number }
  }
}

interface VendorDetailsProps {
  vendorSlug: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatDate = (iso: string | null): string => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTHS[m - 1]} ${y}`
}

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const CircularProgress = ({ value }: { value: number }) => {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="circular-progress">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#106e56"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="circular-progress-text">{value}%</span>
    </div>
  )
}

const SegmentedProgress = ({ total, passed }: { total: number; passed: number }) => {
  return (
    <div className="segmented-progress">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`progress-seg ${i < passed ? 'passed' : 'remaining'}`}
        />
      ))}
    </div>
  )
}

const RatingTrendChart = ({ trend }: { trend: NonNullable<VendorData['ratingTrend']> }) => {
  const points = trend.points
  const labels = points.map((point) => {
    const date = new Date(point.date)
    return Number.isNaN(date.getTime())
      ? point.date
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  })
  const chartData = {
    labels,
    datasets: [{
      data: points.map((point) => point.rating),
      borderColor: '#106e56',
      backgroundColor: 'rgba(16, 110, 86, 0.12)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#106e56',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: points.length > 20 ? 2 : 3.5,
      pointHoverRadius: 6,
    }],
  }
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Pass rate: ${Number(context.parsed.y).toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#7e7e7e', maxTicksLimit: 5, maxRotation: 0 },
        border: { display: false },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: '#7e7e7e',
          callback: (value) => `${value}%`,
        },
        grid: { color: 'rgba(126, 126, 126, 0.16)' },
        border: { display: false, dash: [3, 3] },
      },
    },
  }

  return (
    <div className="rating-trend-chart">
      <div className="rating-trend-canvas">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}

const vendorForStandard = (vendor: VendorData, standardId: StandardId): VendorData => {
  const threshold = getStandard(standardId).minPurity
  const tests = vendor.testHistory.items.filter((test) => (test.purity ?? 0) >= threshold)
  const passCount = tests.filter((test) => test.result === 'pass').length
  const peptideGroups = new Map<string, { pass: number; total: number; purityTotal: number; purityCount: number }>()

  for (const test of tests) {
    const group = peptideGroups.get(test.peptideName) ?? { pass: 0, total: 0, purityTotal: 0, purityCount: 0 }
    group.total += 1
    if (test.result === 'pass') group.pass += 1
    if (test.purity != null) {
      group.purityTotal += test.purity
      group.purityCount += 1
    }
    peptideGroups.set(test.peptideName, group)
  }

  const peptides = [...peptideGroups.entries()].map(([name, group]) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name,
    pricePerMg: vendor.peptides.find((peptide) => peptide.name === name)?.pricePerMg ?? null,
    rating: Math.round((group.pass / group.total) * 100),
    averagePurity: group.purityCount > 0
      ? Math.round((group.purityTotal / group.purityCount) * 10) / 10
      : null,
    testCount: group.total,
  }))

  let cumulativePasses = 0
  const trendPoints = [...tests].reverse().map((test, index) => {
    if (test.result === 'pass') cumulativePasses += 1
    const rating = Math.round((cumulativePasses / (index + 1)) * 100)
    return { date: test.date, rating, label: `${rating}%` }
  })
  const ratingTrend = trendPoints.length > 0 ? {
    bands: vendor.ratingTrend?.bands ?? [],
    points: trendPoints,
    xAxisLabels: [trendPoints[0]?.date, trendPoints[Math.floor((trendPoints.length - 1) / 2)]?.date, trendPoints.at(-1)?.date]
      .filter((date): date is string => Boolean(date)),
  } : null
  const ranking = vendor.rankingsByStandard?.[standardId]

  return {
    ...vendor,
    testsCount: tests.length,
    peptidesCount: peptides.length,
    latestUpdate: tests[0]?.date ?? null,
    rating: tests.length ? Math.round((passCount / tests.length) * 100) : null,
    rank: ranking?.rank ?? null,
    rankedVendorsCount: ranking?.rankedVendorsCount ?? 0,
    testsPassed: passCount,
    testsTotal: tests.length,
    peptides,
    ratingTrend,
    testHistory: {
      ...vendor.testHistory,
      total: tests.length,
      passCount,
      failCount: tests.length - passCount,
      items: tests,
      pagination: {
        ...vendor.testHistory.pagination,
        page: 1,
        totalPages: Math.max(1, Math.ceil(tests.length / vendor.testHistory.pagination.pageSize)),
      },
    },
  }
}

export default function VendorDetails({ vendorSlug }: VendorDetailsProps) {
  const { tone: membershipTone, loading: membershipLoading } = useMembership()
  const [standardId, setStandardId] = useState<StandardId>('purity-focus')
  const [data, setData] = useState<VendorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')
  const [historyPage, setHistoryPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setHistoryPage(1)
    fetch(`${API_BASE}/vendors/${encodeURIComponent(vendorSlug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Vendor not found')
        return res.json()
      })
      .then((json) => {
        if (cancelled) return
        setData(json.vendor)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Could not load vendor details.')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [vendorSlug])

  const filteredVendor = useMemo(() => data ? vendorForStandard(data, standardId) : null, [data, standardId])
  const tabs = useMemo(() => {
    if (!filteredVendor) return ['Overview']
    return [
      'Overview',
      ...(filteredVendor.peptides.slice(0, 2).map((p) => p.name) as string[]),
    ]
  }, [filteredVendor])

  useEffect(() => {
    setHistoryPage(1)
    setActiveTab('Overview')
  }, [standardId])

  if (loading) {
    return (
      <div className="vendor-details">
        <div className="vendor-details-inner">
          <div className="vd-loading">
            <span className="vd-spinner" role="status" aria-label="Loading" />
            <span>Loading vendor details…</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="vendor-details">
        <div className="vendor-details-inner">
          <div className="vd-error">{error || 'Vendor not found.'}</div>
        </div>
      </div>
    )
  }

  const vendor = filteredVendor ?? data
  const history = vendor.testHistory
  const historyEnd = Math.min(historyPage * history.pagination.pageSize, history.total)

  return (
    <div className="vendor-details">
      <div className="vendor-details-inner">
        {/* Back link */}
        <a href="/vendors" className="vd-back-link">
          <FontAwesomeIcon icon={faArrowLeft} className="vd-back-icon" />
          <span>Vendors</span>
        </a>

        {/* Profile row */}
        <div className="vd-profile-row">
          <div className="vd-avatar">
            {vendor.avatarUrl ? (
              <img src={vendor.avatarUrl} alt="" />
            ) : (
              <span className="vd-avatar-initials">{initialsFromName(vendor.name)}</span>
            )}
          </div>
          <div className="vd-profile-info">
            <h1 className="vd-vendor-name">{vendor.name}</h1>
            <div className="vd-meta-row">
              <span>{vendor.location}</span>
              <span className="vd-meta-dot">·</span>
              <span>{vendor.testsCount} tests</span>
              <span className="vd-meta-dot">·</span>
              <span>{vendor.peptidesCount} peptides</span>
              <span className="vd-meta-dot">·</span>
              <span>latest {formatDate(vendor.latestUpdate)}</span>
            </div>
          </div>
        </div>

        {/* Action cards */}
        <div className="vd-action-cards">
          {vendor.websiteUrl ? <a href={vendor.websiteUrl} className="vd-action-card" target="_blank" rel="noreferrer">
            <div className="vd-action-card-left">
              <span className="vd-action-icon-wrap">
                <FontAwesomeIcon icon={faGlobe} className="vd-action-icon" />
              </span>
              <div className="vd-action-text">
                <span className="vd-action-title">Visit Website</span>
                <span className="vd-action-sub">{vendor.websiteUrl}</span>
              </div>
            </div>
            <FontAwesomeIcon icon={faExternalLinkAlt} className="vd-action-arrow" />
          </a> : null}

          {vendor.intelligenceReport ? <div className="vd-action-card">
            <div className="vd-action-card-left">
              <span className="vd-action-icon-wrap">
                <FontAwesomeIcon icon={faFileLines} className="vd-action-icon" />
              </span>
              <div className="vd-action-text">
                <span className="vd-action-title">Intelligence Report</span>
                <span className="vd-action-sub">
                  {vendor.intelligenceReport.pageCount} pages · who runs this vendor
                </span>
              </div>
            </div>
          </div> : null}
        </div>

        {/* Test supply CTA */}
        <a href="/testing" className="vd-cta-button">
          Test my supply →
        </a>

        {/* Overview section */}
        <div className="vd-overview-card">
          <div className="vd-tab-bar">
            {tabs.map((tab) => {
              const badge = vendor.peptides.find((peptide) => peptide.name === tab)?.rating
              return (
                <button
                  key={tab}
                  type="button"
                  className={`vd-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  {badge != null ? <span className="vd-tab-badge">{badge}%</span> : null}
                </button>
              )
            })}
          </div>

          <div className="vd-overview-content">
            <div className="vd-rating-column">
              <div className="vd-rating-big-desktop">{vendor.rating == null ? '—' : `${vendor.rating}%`}</div>
              <div className="vd-rating-big-mobile">
                {vendor.rating == null ? '—' : <CircularProgress value={vendor.rating} />}
              </div>
              <div className="vd-rating-label">PEPTRACE RATING</div>
              <div className="vd-rank-text">
                {vendor.rank == null ? 'Not yet ranked' : `#${vendor.rank} of ${vendor.rankedVendorsCount} ranked vendors`}
              </div>
              <div className="vd-tests-passed">
                {vendor.testsPassed} of {vendor.testsTotal} classifiable tests passed
              </div>
              <SegmentedProgress total={6} passed={Math.round((vendor.testsPassed / Math.max(1, vendor.testsTotal)) * 6)} />
              <div className="vd-methodology-row">
                <a href="/methodology">methodology</a>
                <span className="vd-meta-dot">·</span>
                <span className="vd-purity-focus">{getStandard(standardId).label}</span>
              </div>
            </div>

            <div className="vd-analysis-column">
              <h3 className="vd-analysis-heading">peptrace Analysis</h3>
              <p className="vd-analysis-text">{vendor.analysisText ?? 'No editorial analysis has been published for this vendor.'}</p>
              <div className="vd-filter-row">
                <StandardFilter value={standardId} onChange={setStandardId} allLabel="All tests" />
                <a href="/methodology" className="vd-methodology-link">methodology →</a>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Report */}
        {vendor.intelligenceReport ? <div className="vd-intel-card">
          <div className="vd-intel-header">
            <span className="vd-action-icon-wrap dark">
              <FontAwesomeIcon icon={faFileLines} className="vd-action-icon light" />
            </span>
            <span className="vd-intel-label">Vendor Intelligence Report</span>
          </div>
          <h2 className="vd-intel-title">{vendor.intelligenceReport.title}</h2>
          <p className="vd-intel-desc">{vendor.intelligenceReport.description}</p>
          <div className="vd-intel-stats">
            <span>{vendor.intelligenceReport.pageCount} Pages</span>
            <span className="vd-meta-dot">·</span>
            <span>{vendor.intelligenceReport.riskFactorsAssessed} Risk Factors Assessed</span>
            <span className="vd-meta-dot">·</span>
            <span>{formatDate(vendor.intelligenceReport.publishedDate)}</span>
          </div>
          <button type="button" className="vd-intel-button">
            READ THE REPORT
            <FontAwesomeIcon icon={faExternalLinkAlt} className="vd-intel-btn-icon" />
          </button>
        </div> : null}

        {/* Two-column section */}
        <div className="vd-two-column">
          <div className="vd-left-column">
            {/* Peptides table */}
            <div className="vd-card">
              <div className="vd-card-header">
                <h3 className="vd-card-title">Peptides</h3>
                <span className="vd-card-sub">
                  {vendor.peptides.length} RATED · TAP TO FOCUS
                </span>
              </div>
              <div className="vd-table-wrap">
                <table className="vd-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>PEPTIDE</th>
                      <th>$/MG</th>
                      <th>RATING</th>
                      <th>N</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendor.peptides.map((p, i) => (
                      <tr key={p.id}>
                        <td>{i + 1}</td>
                        <td>{p.name}</td>
                        <td>{p.pricePerMg == null ? '—' : `$${p.pricePerMg.toFixed(2)}`}</td>
                        <td>
                          <span className="vd-rating-badge">{p.rating == null ? '—' : `${p.rating}%`}</span>
                        </td>
                        <td>{p.testCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vendor.peptides.length === 0 ? <p className="vd-corrections-body">No verified peptide tests yet.</p> : null}
              </div>
            </div>

            {/* Contact channels */}
            <div className="vd-card">
              <div className="vd-card-header">
                <h3 className="vd-card-title">Contact channels</h3>
                <span className="vd-card-sub">
                  {vendor.contactChannels.length} CHANNELS ON FILE
                </span>
              </div>
              <div className="vd-contact-list">
                {vendor.contactChannels.map((c, i) => (
                  <a key={i} href={c.url} className="vd-contact-row" target="_blank" rel="noreferrer">
                    <span className="vd-contact-icon-wrap">
                      <FontAwesomeIcon
                        icon={
                          c.type === 'website'
                            ? faGlobe
                            : c.type === 'whatsapp'
                              ? faMessage
                              : faEnvelope
                        }
                        className="vd-contact-icon"
                      />
                    </span>
                    <div className="vd-contact-info">
                      <span className="vd-contact-type">
                        {c.type.charAt(0).toUpperCase() + c.type.slice(1)}
                      </span>
                      <span className="vd-contact-value">{c.value}</span>
                    </div>
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="vd-contact-arrow" />
                  </a>
                ))}
                {vendor.contactChannels.length === 0 ? <p className="vd-corrections-body">No verified contact channels on file.</p> : null}
              </div>
            </div>
          </div>

          <div className="vd-right-column">
            {/* Rating trend */}
            {vendor.ratingTrend ? <div className="vd-card">
              <div className="vd-card-header">
                <h3 className="vd-card-title">Rating trend</h3>
                <span className="vd-card-sub">ALL PEPTIDES, AFTER EACH TEST</span>
              </div>
              <div className="vd-chart-label">CUMULATIVE PEPTRACE RATING</div>
              <RatingTrendChart trend={vendor.ratingTrend} />
            </div> : null}

            {/* Membership */}
            {!membershipLoading && membershipTone !== 'gold' ? <div className="vd-membership-card">
              <div className="vd-membership-icon-wrap">
                <FontAwesomeIcon icon={faFileLines} className="vd-membership-icon" />
              </div>
              <div className="vd-membership-label">peptrace MEMBERSHIP</div>
              <h3 className="vd-membership-title">Unlock original COAs</h3>
              <p className="vd-membership-desc">
                View and download original lab PDFs for Peptrace-verified tests for {vendor.name}.
              </p>
              <ul className="vd-membership-features">
                <li>
                  <FontAwesomeIcon icon={faCircleCheck} className="vd-feature-icon" />
                  Full test history
                </li>
                <li>
                  <FontAwesomeIcon icon={faCircleCheck} className="vd-feature-icon" />
                  Original lab PDFs
                </li>
                <li>
                  <FontAwesomeIcon icon={faCircleCheck} className="vd-feature-icon" />
                  Priority support
                </li>
              </ul>
              <button type="button" className="vd-membership-button" onClick={() => navigate('/membership')}>
                <FontAwesomeIcon icon={faCreditCard} className="vd-membership-btn-icon" />
                Upgrade to PepTrace Gold
              </button>
            </div> : null}
          </div>
        </div>

        {/* Test history */}
        <div className="vd-card">
          <div className="vd-card-header stacked">
            <div>
              <h3 className="vd-card-title">{vendor.name} test history</h3>
              <span className="vd-card-sub">
                {history.total} TESTS ·{' '}
                <span className="vd-pass-count">{history.passCount} PASS</span> ·{' '}
                <span className="vd-fail-count">{history.failCount} FAIL</span> · COA-BACKED LAB TESTS
              </span>
            </div>
          </div>
          <div className="vd-table-wrap">
            <table className="vd-table history-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>RESULT</th>
                  <th>TEST</th>
                  <th>LAB</th>
                  <th>PURITY</th>
                  <th>DOSAGE</th>
                  <th>LABEL</th>
                  <th>COA</th>
                </tr>
              </thead>
              <tbody>
                {history.items.slice(0, historyEnd).map((item, i) => (
                  <tr key={i}>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      <span className={`vd-result ${item.result}`}>
                        <span className="vd-result-dot" />
                        {item.result === 'pass' ? 'Pass' : 'Fail'}
                      </span>
                      {!item.result || item.result === 'fail' ? (
                        <span className="vd-fail-reason">purity below standard</span>
                      ) : null}
                    </td>
                    <td>
                      <div className="vd-test-name">{item.peptideName}</div>
                      <div className="vd-test-vendor">{item.vendorName}</div>
                    </td>
                    <td>
                      <span className="vd-lab-badge">{item.labName}</span>
                    </td>
                    <td>{item.purity ?? '—'}%</td>
                    <td>{item.dosageDeviation ?? '—'}</td>
                    <td>
                      {item.testedMg ?? '—'} / {item.labelMg ?? '—'} mg
                      <div className="vd-batch">{item.batchInfo}</div>
                    </td>
                    <td>
                      {item.coaUrl ? (
                        <a href={item.coaUrl} className="vd-coa-link">VIEW COA</a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="vd-pagination">
            <span className="vd-pagination-range">
              1-{historyEnd} OF {history.total}
            </span>
            <div className="vd-pagination-buttons">
              {historyPage < history.pagination.totalPages ? (
                <button
                  type="button"
                  onClick={() => setHistoryPage((p) => Math.min(history.pagination.totalPages, p + 1))}
                >
                  Load More
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="vd-card vd-about-card">
          <h3 className="vd-about-title">About {vendor.name} test results from Peptrace</h3>
          <div className="vd-about-text">
            {(vendor.about ?? 'No vendor profile has been published.').split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        {/* Corrections */}
        <div className="vd-card vd-corrections-card">
          <div className="vd-card-header">
            <h3 className="vd-card-title">Corrections</h3>
            <span className="vd-card-sub">{vendor.correctionsCount} CORRECTIONS</span>
          </div>
          <p className="vd-corrections-body">No corrections.</p>
        </div>

        {/* Second CTA */}
        <a href="/testing" className="vd-cta-button">
          Test my supply →
        </a>
      </div>
    </div>
  )
}
