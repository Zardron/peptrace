import './App.css'
import HeaderBar from './components/HeaderBar/HeaderBar'
import HomeTopInfo from './components/HomeTopInfo/HomeTopInfo'
import Leaderboards from './components/Leaderboards/Leaderboards'
import HomeBottom from './components/HomeBottom/HomeBottom'
import SiteFooter from './components/SiteFooter/SiteFooter'
import { leaderboardCards } from './data/leaderboardData'

function App() {
  return (
    <div className="app">
      <HeaderBar />
      <main className="main">
        <HomeTopInfo />
        <Leaderboards cards={leaderboardCards} />
        <HomeBottom />
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
