export function parseReadingRoute() {
  const hash = window.location.hash.slice(1)

  if (hash === 'elsewhere') {
    return { layer: 'elsewhere', noteSlug: null }
  }

  if (hash === 'notes') {
    return { layer: 'notes', noteSlug: null }
  }

  if (hash.startsWith('notes/')) {
    const noteSlug = hash.slice('notes/'.length)
    return noteSlug
      ? { layer: 'notes', noteSlug: decodeURIComponent(noteSlug) }
      : { layer: 'notes', noteSlug: null }
  }

  return { layer: null, noteSlug: null }
}

export function notesListUrl() {
  return '#notes'
}

export function noteUrl(slug) {
  return `#notes/${slug}`
}

export function notePath(slug) {
  return `/notes/${slug}/`
}

export function notesListPath() {
  return '/notes/'
}

export function appUrlForRoute(layer, noteSlug) {
  if (layer === 'notes' && noteSlug) return noteUrl(noteSlug)
  if (layer === 'notes') return notesListUrl()
  if (layer === 'elsewhere') return '#elsewhere'
  return `${window.location.pathname}${window.location.search}`
}
