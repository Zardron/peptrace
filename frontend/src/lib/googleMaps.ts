let loading: Promise<typeof google.maps.places> | null = null

export const loadGooglePlaces = (): Promise<typeof google.maps.places> => {
  if (!loading) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'))
    }
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async`
      script.async = true
      script.onload = () => {
        google.maps.importLibrary('places').then(
          (places) => resolve(places as typeof google.maps.places),
          () => reject(new Error('Failed to load Google Places library')),
        )
      }
      script.onerror = () => reject(new Error('Failed to load Google Maps'))
      document.head.appendChild(script)
    })
  }
  return loading
}
