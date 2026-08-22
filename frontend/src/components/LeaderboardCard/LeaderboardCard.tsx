import './LeaderboardCard.css';

export interface LeaderboardCardRow {
  rank: number;
  vendorName: string;
  pricePerMg: string;
  rating: string;
}

export interface LeaderboardCardProps {
  productName: string;
  testCount: string;
  vendorCount: string;
  lastUpdated: string;
  ctaText: string;
  ctaHref: string;
  rows: LeaderboardCardRow[];
  totalVendors: string;
}

function ratingClass(rating: string): string {
  const value = parseInt(rating, 10);
  if (value >= 90) return 'leaderboard-card__rating--high';
  if (value >= 80) return 'leaderboard-card__rating--mid';
  return 'leaderboard-card__rating--low';
}

export function LeaderboardCard({
  productName,
  testCount,
  vendorCount,
  lastUpdated,
  ctaText,
  ctaHref,
  rows,
  totalVendors,
}: LeaderboardCardProps) {
  return (
    <article className="leaderboard-card">
      <div className="leaderboard-card__header">
        <h3 className="leaderboard-card__title">{productName}</h3>
        <p className="leaderboard-card__meta">
          {testCount} · {vendorCount} · {lastUpdated}
        </p>
        <a href={ctaHref} className="leaderboard-card__cta">
          {ctaText}
          <svg
            className="leaderboard-card__cta-arrow"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5 2.5l4 4.5-4 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      <div className="leaderboard-card__table-wrapper">
        <table className="leaderboard-card__table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Vendor</th>
              <th scope="col">$ / mg</th>
              <th scope="col">Rating</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank}>
                <td>{row.rank}</td>
                <td>{row.vendorName}</td>
                <td>{row.pricePerMg}</td>
                <td className={ratingClass(row.rating)}>{row.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="leaderboard-card__footer">
        <a href={`/leaderboard/${productName.toLowerCase()}`}>View Full Leaderboard</a>
        <span className="leaderboard-card__total">{totalVendors}</span>
      </div>
    </article>
  );
}
