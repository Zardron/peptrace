import { useCallback, useEffect, useState } from 'react'
import './App.css'
import AuthModal from './components/AuthModal/AuthModal'
import HeaderBar from './components/HeaderBar/HeaderBar'
import HomeTopInfo from './components/HomeTopInfo/HomeTopInfo'
import Leaderboards from './components/Leaderboards/Leaderboards'
import HomeBottom from './components/HomeBottom/HomeBottom'
import MembershipPage from './components/MembershipPage/MembershipPage'
import FreePeptideTesting from './components/FreePeptideTesting/FreePeptideTesting'
import MethodologyPage from './components/MethodologyPage/MethodologyPage'
import SiteFooter from './components/SiteFooter/SiteFooter'
import VendorsList from './components/VendorsList/VendorsList'
import VendorDetails from './components/VendorDetails/VendorDetails'
import VendorSignupForm from './components/VendorSignupForm/VendorSignupForm'
import ShipmentDetails from './components/ShipmentDetails/ShipmentDetails'
import FullLeaderboard from './components/FullLeaderboard/FullLeaderboard'
import AccountPages, { type AccountView } from './components/AccountPages/AccountPages'
import LegalPage from './components/LegalPage/LegalPage'
import AnnouncementBar from './components/AnnouncementBar/AnnouncementBar'
import AllPeptides from './components/AllPeptides/AllPeptides'
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
  ['/account/support', 'support'],
  ['/support', 'support'],
])

const routedPaths = new Set(['/membership', '/vendors', '/vendor-signup', '/testing', '/terms', '/privacy', '/refund', '/data-deletion', '/methodology', '/products', '/vendor-signup', ...accountRoutes.keys()])

const PRODUCT_LEADERBOARD_PREFIX = '/product/'
const PRODUCT_LEADERBOARD_SUFFIX = '/leaderboard'

const getProductLeaderboardSlug = (path: string): string | null => {
  if (!path.startsWith(PRODUCT_LEADERBOARD_PREFIX) || !path.endsWith(PRODUCT_LEADERBOARD_SUFFIX)) {
    return null
  }
  const slug = path.slice(PRODUCT_LEADERBOARD_PREFIX.length, -PRODUCT_LEADERBOARD_SUFFIX.length)
  return slug ? slug : null
}

const getCurrentPagePath = () => {
  if (typeof window === 'undefined') {
    return '/'
  }

  const path = window.location.pathname
  if (routedPaths.has(path)) return path
  if (path.startsWith('/vendors/') && path !== '/vendors') return path
  if (path.startsWith('/shipment/') && path !== '/shipment') return path
  if (getProductLeaderboardSlug(path)) return path
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
  if (modalFrom.startsWith('/shipment/') && modalFrom !== '/shipment') return modalFrom
  if (getProductLeaderboardSlug(modalFrom)) return modalFrom
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
  const isLegalPage = pagePath === '/terms' || pagePath === '/privacy' || pagePath === '/refund' || pagePath === '/data-deletion'
  const isMethodologyPage = pagePath === '/methodology'
  const isProductsPage = pagePath === '/products'
  const isVendorSignUpPage = pagePath === '/vendor-signup'
  const isVendorsPage = pagePath === '/vendors'
  const isVendorDetailsPage = pagePath.startsWith('/vendors/') && pagePath !== '/vendors'
  const productLeaderboardSlug = getProductLeaderboardSlug(pagePath)
  const isShipmentDetailsPage = pagePath.startsWith('/shipment/') && pagePath !== '/shipment'
  const accountView = accountRoutes.get(pagePath)
  const isAccountRoute = Boolean(accountView)

  useEffect(() => {
    if ((isAccountRoute || pagePath === '/vendor-signup') && !isLoading && !user) {
      setAuthOpen(true)
    }
  }, [isAccountRoute, isLoading, pagePath, user])

  if (isLoading) {
    return <div className="app" />
  }

  return (
    <div className="app">
      <AnnouncementBar />
      {isMembershipPage ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute="/membership" />
          <MembershipPage onSignUpClick={openAuthModal} />
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
      ) : isShipmentDetailsPage ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute="/dashboard" />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            <ShipmentDetails shipmentId={pagePath.replace('/shipment/', '')} />
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
      ) : productLeaderboardSlug ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute="/products" />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            <FullLeaderboard slug={productLeaderboardSlug} />
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
      ) : pagePath === '/vendor-signup' ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute="/vendors" />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            <VendorSignupForm onBack={() => navigate('/vendors')} />
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
      ) : isLegalPage ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute={pagePath} />
          <LegalPage path={pagePath} />
          <SiteFooter />
        </>
      ) : isMethodologyPage ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute="/methodology" />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            <MethodologyPage />
          </main>
          <SiteFooter />
        </>
      ) : isProductsPage ? (
        <>
          <HeaderBar onSignUpClick={openAuthModal} activeRoute="/products" />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            <AllPeptides />
          </main>
          <SiteFooter />
        </>
      ) : isVendorSignUpPage ? (
        <>
          <HeaderBar onSignUpClick={!user ? openAuthModal : undefined} activeRoute="/vendor-signup" />
          <main className={`main ${authOpen ? 'auth-page-preview' : ''}`}>
            {user ? (
              <VendorSignupForm />
            ) : (
              <section className="vendor-signup-gate">
                <h2>Log in to apply</h2>
                <p>Vendor applications are available to signed-in Peptrace accounts.</p>
                <button type="button" className="vendor-cta" onClick={openAuthModal}>
                  Log in or create an account
                </button>
              </section>
            )}
          </main>
          <SiteFooter />
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
