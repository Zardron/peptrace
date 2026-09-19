import { useCallback, useEffect, useState } from 'react'
import './App.css'
import AuthModal from './components/AuthModal/AuthModal'
import HeaderBar from './components/HeaderBar/HeaderBar'
import HomeTopInfo from './components/HomeTopInfo/HomeTopInfo'
import Leaderboards from './components/Leaderboards/Leaderboards'
import HomeBottom from './components/HomeBottom/HomeBottom'
import MembershipPage from './components/MembershipPage/MembershipPage'
import FreePeptideTesting from './components/FreePeptideTesting/FreePeptideTesting'
import SiteFooter from './components/SiteFooter/SiteFooter'
import VendorsList from './components/VendorsList/VendorsList'
import VendorDetails from './components/VendorDetails/VendorDetails'
import AccountPages, { type AccountView } from './components/AccountPages/AccountPages'
import { useAuth } from './context/AuthContext'
import { navigate } from './lib/navigation'

const accountRoutes = new Map<string, AccountView>([
  ['/dashboard', 'dashboard'],
  ['/account', 'profile'],
  ['/account/security', 'security'],
  ['/account/notifications', 'notifications'],
  ['/account/billing', 'billing'],
  ['/account/shipping', 'shipping'],
  ['/account/privacy', 'privacy'],
])

const routedPaths = new Set(['/membership', '/vendors', '/testing', ...accountRoutes.keys()])

const getCurrentPagePath = () => {
  if (typeof window === 'undefined') {
    return '/'
  }

  const path = window.location.pathname
  if (routedPaths.has(path)) return path
  if (path.startsWith('/vendors/') && path !== '/vendors') return path
  return '/'
}

const getModalSourcePath = () => {
  if (typeof window === 'undefined') {
    return '/'
  }

  const modalFrom = window.history.state?.modalFrom
  if (typeof modalFrom !== 'string') return '/'
  if (routedPaths.has(modalFrom)) return modalFrom
  if (modalFrom.startsWith('/vendors/') && modalFrom !== '/vendors') return modalFrom
  return '/'
}

function App() {
  const { user, isLoading } = useAuth()
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

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const anchor = (event.target as HTMLElement).closest('a')
      const href = anchor?.getAttribute('href')
      if (!anchor || !href || href.startsWith('#') || anchor.target || anchor.hasAttribute('download')) {
        return
      }

      const url = new URL(href, window.location.origin)
      if (url.origin !== window.location.origin) {
        return
      }

      event.preventDefault()
      navigate(url.pathname + url.search + url.hash)
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  const isMembershipPage = pagePath === '/membership'
  const isTestingPage = pagePath === '/testing'
  const isVendorsPage = pagePath === '/vendors'
  const isVendorDetailsPage = pagePath.startsWith('/vendors/') && pagePath !== '/vendors'
  const accountView = accountRoutes.get(pagePath)
  const isAccountRoute = Boolean(accountView)

  useEffect(() => {
    if (isAccountRoute && !isLoading && !user) {
      setAuthOpen(true)
    }
  }, [isAccountRoute, isLoading, user])

  if (isLoading) {
    return <div className="app" />
  }

  return (
    <div className="app">
      {isMembershipPage ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute="/membership" />
          <MembershipPage />
        </>
      ) : accountView && user ? (
        <>
          <HeaderBar activeRoute={pagePath} />
          <AccountPages view={accountView} />
        </>
      ) : accountView && !user ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute={pagePath} />
          <main className="main auth-page-preview">
            <HomeTopInfo />
            <Leaderboards />
            <HomeBottom />
          </main>
          <SiteFooter />
        </>
      ) : isVendorDetailsPage ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute="/vendors" />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            <VendorDetails vendorSlug={pagePath.replace('/vendors/', '')} />
          </main>
          <SiteFooter />
        </>
      ) : isVendorsPage ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute="/vendors" />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            <VendorsList />
          </main>
          <SiteFooter />
        </>
      ) : isTestingPage ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute="/testing" />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            <FreePeptideTesting />
            <HomeBottom />
            <SiteFooter />
          </main>
        </>
      ) : (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute={pagePath} />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            <HomeTopInfo />
            <Leaderboards />
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
