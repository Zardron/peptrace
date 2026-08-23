import './Leaderboards.css'
import LeaderboardCard from '../LeaderboardCard/LeaderboardCard'
import type { LeaderboardCardProps } from '../LeaderboardCard/LeaderboardCard'

interface LeaderboardsProps {
  cards: LeaderboardCardProps[]
}

export default function Leaderboards({ cards }: LeaderboardsProps) {
  return (
    <section className="leaderboards">
      <div className="leaderboards-header">
        <h2 className="section-title">Leaderboards</h2>
        <div className="section-tabs">
          <button type="button" className="tab active">all peptides</button>
          <button type="button" className="tab">all vendors</button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-left">
          <span className="filter-label">Purity Focused</span>
          <span className="filter-badge">purity 99.5%+</span>
          <span className="filter-badge">dose ±35%</span>
          <svg className="filter-chevron" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L6 6L11 1" stroke="#7e7e7e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="filter-right">
          <span className="filter-label">Rank by</span>
          <div className="toggle">
            <button type="button" className="toggle-option">rating</button>
            <button type="button" className="toggle-option active">$ / mg</button>
          </div>
        </div>
      </div>

      <div className="boards-grid">
        {cards.map((card, index) => (
          <LeaderboardCard key={index} {...card} />
        ))}
      </div>
    </section>
  )
}
