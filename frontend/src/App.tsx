import { HeaderBar } from './components/HeaderBar/HeaderBar';
import { HomeTopInfo } from './components/HomeTopInfo/HomeTopInfo';
import { Leaderboards } from './components/Leaderboards/Leaderboards';
import { HomeBottom } from './components/HomeBottom/HomeBottom';
import { SiteFooter } from './components/SiteFooter/SiteFooter';
import { leaderboardCards } from './data/leaderboardData';
import './App.css';

function App() {
  return (
    <div className="page">
      <HeaderBar />
      <HomeTopInfo />
      <main className="page-section">
        <Leaderboards cards={leaderboardCards} />
      </main>
      <section className="page-section">
        <HomeBottom />
      </section>
      <SiteFooter />
    </div>
  );
}

export default App;
