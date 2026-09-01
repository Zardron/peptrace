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
            <rect y="9" width="11.1436" height="2" fill="#106E56" />
            <path d="M3.09668 0.52832C3.13848 0.489068 3.20124 0.492004 3.2373 0.52832L3.23926 0.530273L6.65137 3.92969L6.65234 3.93164C6.6923 3.97102 6.69253 4.03112 6.65332 4.07031L3.24121 7.46973C3.19948 7.51109 3.13533 7.50851 3.09863 7.47168L3.09668 7.46973L2.5293 6.9043C2.48905 6.86374 2.49238 6.803 2.52832 6.76758L2.5293 6.76562L4.94824 4.35645L5.30371 4.00293L4.94824 3.64844L2.5293 1.23926C2.48869 1.1987 2.49228 1.13806 2.52832 1.10254L2.53223 1.09766L3.09668 0.52832ZM7.91504 0.52832C7.95178 0.491326 8.01682 0.488663 8.05859 0.530273L11.4707 3.92969C11.5121 3.97131 11.506 4.03001 11.4736 4.06152L11.4707 4.06543L8.05859 7.46484L8.05664 7.4668C8.02 7.50363 7.95582 7.50605 7.91406 7.46484L7.34668 6.89941L7.34473 6.89746L7.32422 6.86719C7.31011 6.83318 7.31612 6.79118 7.34668 6.76074L9.76465 4.35156L10.1211 3.99707L9.76465 3.64355L7.34668 1.23438L7.34473 1.23242L7.32422 1.20117C7.31027 1.16728 7.31636 1.12605 7.34668 1.0957L7.91406 0.530273L7.91504 0.52832Z" fill="black" stroke="black" />
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
          {rows.map((row) => (
            <div className="table-row" key={row.rank}>
              <span className="col-rank rank-number">{row.rank}</span>
              <span className="col-vendor vendor-cell">
                <span className="vendor-avatar" />
                <span className="vendor-name">{row.vendorName}</span>
              </span>
              <span className="col-price">{row.pricePerMg}</span>
              <span className="col-rating">{row.rating}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-footer">
        <a href="/leaderboard" className="footer-link">View Full Leaderboard</a>
        <span className="footer-count">{totalVendors}</span>
      </div>
    </article>
  )
}
