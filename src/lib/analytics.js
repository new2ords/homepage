const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

const PAGE_TITLES = {
  '/': 'new²ords',
  '/release': 'new²ords — meteor',
  '/lyrics': 'new²ords — meteor — lyrics',
  '/notes': 'new²ords — notes',
  '/elsewhere': 'new²ords — elsewhere',
}

let enabled = false

export function getAnalyticsPath(level, activeLayer) {
  if (activeLayer === 'notes') return '/notes'
  if (activeLayer === 'elsewhere') return '/elsewhere'
  if (level === 2) return '/lyrics'
  if (level === 1) return '/release'
  return '/'
}

export function initAnalytics() {
  if (!MEASUREMENT_ID || import.meta.env.DEV) return false

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  enabled = true
  return true
}

export function trackPageView(path) {
  if (!enabled || !window.gtag) return

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: PAGE_TITLES[path] || 'new²ords',
    page_location: `${window.location.origin}${path}`,
  })
}
