export const navigate = (path: string) => {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  if (!path.includes('#')) {
    window.scrollTo(0, 0)
  }
}
