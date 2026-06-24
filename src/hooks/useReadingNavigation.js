import { useCallback, useEffect, useRef, useState } from 'react'
import { appUrlForRoute, parseReadingRoute } from '../lib/routing'

export function useReadingNavigation() {
  const [route, setRoute] = useState(parseReadingRoute)
  const activeLayerRef = useRef(route.layer)

  activeLayerRef.current = route.layer

  const replaceRoute = useCallback((layer, nextNoteSlug) => {
    setRoute({ layer, noteSlug: nextNoteSlug })
    window.history.replaceState(
      {
        layer,
        noteSlug: nextNoteSlug,
        readingEntry: true,
        canReturnToMain: window.history.state?.canReturnToMain === true,
      },
      '',
      appUrlForRoute(layer, nextNoteSlug),
    )
  }, [])

  const openLayer = useCallback((layer) => {
    const isReading = activeLayerRef.current !== null
    setRoute({ layer, noteSlug: null })
    window.history[isReading ? 'replaceState' : 'pushState'](
      {
        layer,
        noteSlug: null,
        readingEntry: true,
        canReturnToMain: isReading
          ? window.history.state?.canReturnToMain === true
          : true,
      },
      '',
      appUrlForRoute(layer, null),
    )
  }, [])

  const openNote = useCallback(
    (slug) => replaceRoute('notes', slug),
    [replaceRoute],
  )

  const backToNotes = useCallback(
    () => replaceRoute('notes', null),
    [replaceRoute],
  )

  const closeLayer = useCallback(() => {
    setRoute({ layer: null, noteSlug: null })
    if (
      window.history.state?.readingEntry === true &&
      window.history.state?.canReturnToMain === true
    ) {
      window.history.back()
      return
    }
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}`,
    )
  }, [])

  useEffect(() => {
    const syncRoute = () => {
      setRoute(parseReadingRoute())
    }
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  return {
    activeLayer: route.layer,
    noteSlug: route.noteSlug,
    openLayer,
    openNote,
    backToNotes,
    closeLayer,
  }
}
