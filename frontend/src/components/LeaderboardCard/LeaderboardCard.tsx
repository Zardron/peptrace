import './LeaderboardCard.css'

export interface LeaderboardRow {
  rank: number
  vendorName: string
  pricePerMg: string
  rating: string
}

export interface LeaderboardCardProps {
  productName: string
  testCount: string
  vendorCount: string
  lastUpdated: string
  ctaText: string
  rows: LeaderboardRow[]
  totalVendors: string
}

export default function LeaderboardCard({
  productName,
  testCount,
  vendorCount,
  lastUpdated,
  ctaText,
  rows,
  totalVendors,
}: LeaderboardCardProps) {
  return (
    <article className="leaderboard-card">
      <div className="card-summary">
        <div className="card-heading">
          <h3 className="card-title">{productName}</h3>
          <span className="card-test-count">{testCount}</span>
        </div>
        <div className="card-subtitle">
          <span>{vendorCount}</span>
          <span>{lastUpdated}</span>
        </div>
        <a href="/test" className="card-cta">
          <span>{ctaText}</span>
          <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="4.5" width="10.5" height="2" rx="1" fill="#106e56" />
            <path d="M11.5 5.5L7.5 1.5L7.5 9.5L11.5 5.5Z" fill="#000" stroke="#000" strokeWidth="0.8" />
          </svg>
        </a>
      </div>

      <div className="card-table">
        <div className="table-header">
          <span className="col-rank">#</span>
          <span className="col-vendor">Vendor</span>
          <span className="col-price">$ / mg</span>
          <span className="col-rating">Rating</span>
        </div>
        <div className="table-body">
          {rows.length === 0 ? (
            <div className="table-empty">No vendors match this filter.</div>
          ) : (
            rows.map((row) => (
              <div className="table-row" key={row.rank}>
                <span className="col-rank rank-number">{row.rank}</span>
                <span className="col-vendor vendor-cell">
                  <span className="vendor-avatar" />
                  <span className="vendor-name">{row.vendorName}</span>
                </span>
                <span className="col-price">{row.pricePerMg}</span>
                <span className="col-rating">{row.rating}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card-footer">
        <a href="/leaderboard" className="footer-link">View Full Leaderboard</a>
        <span className="footer-count">{totalVendors}</span>
      </div>
    </article>
  )
}
