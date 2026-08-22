import { useState } from 'react';
import { LeaderboardCard } from '../LeaderboardCard/LeaderboardCard';
import type { LeaderboardCardData } from '../../data/leaderboardData';
import './Leaderboards.css';

export interface LeaderboardsProps {
  cards: LeaderboardCardData[];
  defaultTab?: 'all peptides' | 'all vendors';
  defaultRankBy?: 'price' | 'rating';
}

export function Leaderboards({
  cards,
  defaultTab = 'all peptides',
  defaultRankBy = 'price',
}: LeaderboardsProps) {
  const [activeTab, setActiveTab] = useState<'all peptides' | 'all vendors'>(defaultTab);
  const [rankBy, setRankBy] = useState<'price' | 'rating'>(defaultRankBy);

  return (
    <section className="leaderboards" aria-labelledby="leaderboards-title">
      <div className="leaderboards__header">
        <h2 id="leaderboards-title">Leaderboards</h2>
        <div className="leaderboards__tabs" role="tablist" aria-label="Leaderboard categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all peptides'}
            className={`leaderboards__tab${activeTab === 'all peptides' ? ' leaderboards__tab--active' : ''}`}
            onClick={() => setActiveTab('all peptides')}
          >
            all peptides
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all vendors'}
            className={`leaderboards__tab${activeTab === 'all vendors' ? ' leaderboards__tab--active' : ''}`}
            onClick={() => setActiveTab('all vendors')}
          >
            all vendors
          </button>
        </div>
      </div>

      <div className="leaderboards__filters">
        <div className="leaderboards__badge">
          Purity Focused
          <span className="leaderboards__badge-sublabel">purity 99.5%+ · dose ±35%</span>
        </div>
        <div className="leaderboards__rank-toggle">
          <span>Rank by</span>
          <div className="leaderboards__rank-options">
            <button
              type="button"
              className={`leaderboards__rank-btn${rankBy === 'price' ? ' leaderboards__rank-btn--active' : ''}`}
              onClick={() => setRankBy('price')}
            >
              $ / mg
            </button>
            <button
              type="button"
              className={`leaderboards__rank-btn${rankBy === 'rating' ? ' leaderboards__rank-btn--active' : ''}`}
              onClick={() => setRankBy('rating')}
            >
              rating
            </button>
          </div>
        </div>
      </div>

      <div className="leaderboards__grid">
        {cards.map((card) => (
          <LeaderboardCard key={card.productName} {...card} />
        ))}
      </div>
    </section>
  );
}
