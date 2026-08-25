import { useCallback, useEffect, useState } from 'react'
import './App.css'
import AuthModal from './components/AuthModal/AuthModal'
import HeaderBar from './components/HeaderBar/HeaderBar'
import HomeTopInfo from './components/HomeTopInfo/HomeTopInfo'
import Leaderboards from './components/Leaderboards/Leaderboards'
import HomeBottom from './components/HomeBottom/HomeBottom'
import MembershipPage from './components/MembershipPage/MembershipPage'
import SiteFooter from './components/SiteFooter/SiteFooter'
import { leaderboardCards } from './data/leaderboardData'

const routedPaths = new Set(['/membership'])

const getCurrentPagePath = () => {
  if (typeof window === 'undefined') {
    return '/'
  }

  return routedPaths.has(window.location.pathname) ? window.location.pathname : '/'
}

const getModalSourcePath = () => {
  if (typeof window === 'undefined') {
    return '/'
  }

  const modalFrom = window.history.state?.modalFrom

  return typeof modalFrom === 'string' && routedPaths.has(modalFrom) ? modalFrom : '/'
}

function App() {
  const [pagePath, setPagePath] = useState(getCurrentPagePath)
  const [authOpen, setAuthOpen] = useState(() => (
    typeof window !== 'undefined' && window.location.pathname === '/signup'
  ))

  const openAuthModal = useCallback(() => {
    const currentPagePath = getCurrentPagePath()

    setPagePath(currentPagePath)
    setAuthOpen(true)

    if (typeof window !== 'undefined' && window.location.pathname !== '/signup') {
      window.history.pushState({ modalFrom: currentPagePath }, '', '/signup')
    }
  }, [])

  const closeAuthModal = useCallback(() => {
    setAuthOpen(false)

    if (typeof window !== 'undefined' && window.location.pathname === '/signup') {
      window.history.pushState(null, '', pagePath)
    }
  }, [pagePath])

  useEffect(() => {
    const handlePopState = () => {
      const isSignupPath = window.location.pathname === '/signup'

      setAuthOpen(isSignupPath)
      setPagePath(isSignupPath ? getModalSourcePath() : getCurrentPagePath())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const isMembershipPage = pagePath === '/membership'

  return (
    <div className="app">
      {isMembershipPage ? (
        <MembershipPage onSignUpClick={openAuthModal} />
      ) : (
        <>
          <HeaderBar onSignUpClick={openAuthModal} />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            <HomeTopInfo />
            <Leaderboards cards={leaderboardCards} />
            <HomeBottom />
          </main>
          <SiteFooter />
        </>
      )}
      <AuthModal open={authOpen} onClose={closeAuthModal} />
    </div>
  )
}

export default App
