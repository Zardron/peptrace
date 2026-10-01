import { useState } from 'react'
import './AllPeptides.css'
import HomeTopInfo from '../HomeTopInfo/HomeTopInfo'
import StandardFilter, { getStandard, type StandardId } from '../StandardFilter/StandardFilter'

type RankBy = 'rating' | 'cost'

interface VendorLineData {
  rank: number
  vendorName: string
  rating: number | null
  tests: number | null
  total: number | null
  latest: string | null
}

interface PeptideData {
  name: string
  vendors: VendorLineData[]
}

const PEPTIDES: PeptideData[] = [
  {
    name: 'Retatrutide',
    vendors: [
      { rank: 1, vendorName: 'Peptide Partners', rating: 93, tests: 293, total: 3858, latest: '20 Sept 2026' },
      { rank: 2, vendorName: 'Inno Peptides', rating: 91, tests: null, total: null, latest: null },
      { rank: 3, vendorName: 'ZLZ Peptide', rating: 91, tests: null, total: null, latest: null },
    ],
  },
  {
    name: 'Tirzepatide',
    vendors: [
      { rank: 1, vendorName: 'Yiwu Aozuo Trading Co', rating: 93, tests: 202, total: 2478, latest: '20 Sept 2026' },
      { rank: 2, vendorName: 'SRY Labs', rating: 92, tests: null, total: null, latest: null },
      { rank: 3, vendorName: 'Andy Peps Studio', rating: 91, tests: null, total: null, latest: null },
    ],
  },
  {
    name: 'BPC-157',
    vendors: [
      { rank: 1, vendorName: 'Nova Peptides', rating: 88, tests: 119, total: 791, latest: '20 Sept 2026' },
      { rank: 2, vendorName: 'Apex Labs', rating: 84, tests: null, total: null, latest: null },
      { rank: 3, vendorName: 'Meridian Bio', rating: 79, tests: null, total: null, latest: null },
    ],
  },
  {
    name: 'Semaglutide',
    vendors: [
      { rank: 1, vendorName: 'Peptide Crafters', rating: 82, tests: 61, total: 345, latest: '20 Sept 2026' },
      { rank: 2, vendorName: 'Paramount Peptides', rating: 81, tests: null, total: null, latest: null },
      { rank: 3, vendorName: 'Skye Peptides', rating: 81, tests: null, total: null, latest: null },
    ],
  },
  {
    name: 'CJC-1295',
    vendors: [
      { rank: 1, vendorName: 'HXNet', rating: 90, tests: 56, total: 294, latest: '20 Sept 2026' },
      { rank: 2, vendorName: 'Yimei', rating: 82, tests: null, total: null, latest: null },
      { rank: 3, vendorName: 'ZLZ Peptide', rating: 44, tests: null, total: null, latest: null },
    ],
  },
  {
    name: 'TB-500',
    vendors: [
      { rank: 1, vendorName: 'Yiwu Aozuo Trading Co', rating: 90, tests: 40, total: 214, latest: '10 Sept 2026' },
      { rank: 2, vendorName: 'Yimei', rating: 80, tests: null, total: null, latest: null },
      { rank: 3, vendorName: 'HK Peptides', rating: 43, tests: null, total: null, latest: null },
    ],
  },
]

function getRatingVariant(rating: number | null): string {
  if (rating == null) return 'empty'
  if (rating >= 90) return 'high'
  if (rating >= 80) return 'medium'
  return 'low'
}

function RatingBadge({ rating }: { rating: number | null }) {
  const variant = getRatingVariant(rating)
  if (rating == null) return <span className="rating-badge empty">-</span>
  return <span className={`rating-badge ${variant}`}>{rating}%</span>
}

function PageHeader() {
  return (
    <div className="all-peptides-header">
      <h1 className="all-peptides-title">Products</h1>
      <div className="all-peptides-tabs">
        <span className="tab active">all peptides</span>
        <a href="/vendors" className="tab">all vendors</a>
      </div>
    </div>
  )
}

interface FilterBarProps {
  standardId: StandardId
  onStandardChange: (id: StandardId) => void
  rankBy: RankBy
  onRankByChange: (rankBy: RankBy) => void
}

function FilterBar({ standardId, onStandardChange, rankBy, onRankByChange }: FilterBarProps) {
  return (
    <div className="all-peptides-filter-bar">
      <StandardFilter value={standardId} onChange={onStandardChange} />
      <div className="all-peptides-filter-right">
        <span className="filter-label">Rank by</span>
        <div className="ap-toggle">
          <button
            type="button"
            className={`ap-toggle-option${rankBy === 'rating' ? ' active' : ''}`}
            onClick={() => onRankByChange('rating')}
          >
            rating
          </button>
          <button
            type="button"
            className={`ap-toggle-option${rankBy === 'cost' ? ' active' : ''}`}
            onClick={() => onRankByChange('cost')}
          >
            $ / mg
          </button>
        </div>
      </div>
    </div>
  )
}

function TableHeader() {
  return (
    <div className="all-peptides-table-header">
      <span className="th-products">PRODUCTS</span>
      <div className="th-rest">
        <span className="th-top-vendors">TOP VENDORS</span>
        <span className="th-vendors">VENDORS</span>
        <span className="th-tests">TESTS</span>
        <span className="th-latest">LATEST</span>
      </div>
    </div>
  )
}

function VendorLine({ line }: { line: VendorLineData }) {
  return (
    <div className="vendor-line">
      <div className="vendor-line-main">
        <span className="vendor-rank">{line.rank}</span>
        <span className="vendor-name">{line.vendorName}</span>
        <RatingBadge rating={line.rating} />
      </div>
      <span className="vendor-col">{line.tests ?? '-'}</span>
      <span className="vendor-col">{line.total ?? '-'}</span>
      <span className="vendor-col">{line.latest ?? '-'}</span>
    </div>
  )
}

function PeptideRow({ peptide }: { peptide: PeptideData }) {
  const slug = peptide.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return (
    <div className="peptide-row" id={`peptide-${slug}`}>
      <div className="peptide-name">{peptide.name}</div>
      <div className="peptide-vendors">
        {peptide.vendors.map((vendor) => (
          <VendorLine key={vendor.rank} line={vendor} />
        ))}
      </div>
    </div>
  )
}

function PeptideTabs({ peptides }: { peptides: PeptideData[] }) {
  const [activeTab, setActiveTab] = useState(0)

  const scrollToPeptide = (index: number) => {
    setActiveTab(index)
    const slug = peptides[index].name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const el = document.getElementById(`peptide-${slug}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="peptide-tabs">
      {peptides.map((peptide, i) => (
        <button
          key={peptide.name}
          type="button"
          className={`peptide-tab${i === activeTab ? ' active' : ''}`}
          onClick={() => scrollToPeptide(i)}
        >
          {peptide.name}
        </button>
      ))}
    </div>
  )
}

function MobilePeptideSection({ peptide }: { peptide: PeptideData }) {
  const firstVendor = peptide.vendors[0]
  return (
    <div
      className="mobile-peptide-section"
      id={`peptide-${peptide.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
    >
      <div className="mobile-peptide-header">
        <h3 className="mobile-peptide-name">{peptide.name}</h3>
        <div className="mobile-peptide-meta">
          <div className="mobile-meta-left">
            <span className="mobile-meta-label">Vendors:</span>
            <span className="mobile-meta-value">{firstVendor?.tests ?? '-'}</span>
            <span className="mobile-meta-label">Tests:</span>
            <span className="mobile-meta-value">{firstVendor?.total ?? '-'}</span>
          </div>
          <div className="mobile-meta-right">
            <span className="mobile-meta-label">Latest:</span>
            <span className="mobile-meta-value">{firstVendor?.latest ?? '-'}</span>
          </div>
        </div>
      </div>
      <div className="mobile-vendor-rows">
        {peptide.vendors.map((vendor) => (
          <div key={vendor.rank} className="mobile-vendor-row">
            <span className="mobile-vendor-rank">{vendor.rank}</span>
            <span className="mobile-vendor-name">{vendor.vendorName}</span>
            <RatingBadge rating={vendor.rating} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AllPeptides() {
  const [standardId, setStandardId] = useState<StandardId>('purity-focus')
  const [rankBy, setRankBy] = useState<RankBy>('rating')

  // Data is hardcoded to match Figma exactly. The standard/rankBy state is
  // wired to the UI controls so future API integration is a drop-in replacement.
  const _standard = getStandard(standardId)
  void _standard
  void rankBy

  return (
    <div className="all-peptides-page">
      <HomeTopInfo />
      <div className="all-peptides">
        <div className="all-peptides-inner">
          <PageHeader />
          <div className="all-peptides-divider" />
          <FilterBar
            standardId={standardId}
            onStandardChange={setStandardId}
            rankBy={rankBy}
            onRankByChange={setRankBy}
          />
          <div className="all-peptides-divider" />

          {/* Desktop / Tablet */}
          <div className="desktop-table">
            <TableHeader />
            <div className="all-peptides-table-body">
              {PEPTIDES.map((peptide) => (
                <PeptideRow key={peptide.name} peptide={peptide} />
              ))}
            </div>
          </div>

          {/* Mobile */}
          <div className="mobile-layout">
            <PeptideTabs peptides={PEPTIDES} />
            {PEPTIDES.map((peptide) => (
              <MobilePeptideSection key={peptide.name} peptide={peptide} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
