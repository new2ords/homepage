import { useCallback, useEffect, useRef, useState } from 'react'
import Atmosphere from './components/Atmosphere'
import CassettePlayer from './components/CassettePlayer'
import EdgeNavigation from './components/EdgeNavigation'
import LyricsGalaxy from './components/LyricsGalaxy'
import ReadingLayer from './components/ReadingLayer'
import Starfield from './components/Starfield'
import { artist } from './data/artist'
import { getAnalyticsPath, trackPageView } from './lib/analytics'
import { appUrlForRoute, parseReadingRoute } from './lib/routing'

const LEVEL = {
  artist: 0,
  release: 1,
  lyrics: 2,
}

export default function App() {
  const [level, setLevel] = useState(LEVEL.artist)
  const initialReadingRoute = parseReadingRoute()
  const [activeLayer, setActiveLayer] = useState(initialReadingRoute.layer)
  const [noteSlug, setNoteSlug] = useState(initialReadingRoute.noteSlug)
  const [playback, setPlayback] = useState({
    time: 0,
    duration: 0,
    sampledAt: 0,
    playing: false,
    buffering: false,
  })
  const wheelLockedRef = useRef(false)
  const touchStartRef = useRef(null)
  const activeLayerRef = useRef(activeLayer)
  const closeLayerRef = useRef(() => {})
  const moveHorizontallyRef = useRef(() => false)

  const goBack = useCallback(() => {
    setLevel((current) => Math.max(LEVEL.artist, current - 1))
  }, [])

  const updatePlayback = useCallback((sample) => {
    setPlayback(sample)
  }, [])

  const openLayer = useCallback((layer) => {
    setActiveLayer(layer)
    setNoteSlug(null)
    window.history.pushState(
      { layer, noteSlug: null },
      '',
      appUrlForRoute(layer, null),
    )
  }, [])

  const openNote = useCallback((slug) => {
    setActiveLayer('notes')
    setNoteSlug(slug)
    window.history.pushState(
      { layer: 'notes', noteSlug: slug },
      '',
      appUrlForRoute('notes', slug),
    )
  }, [])

  const backToNotes = useCallback(() => {
    setActiveLayer('notes')
    setNoteSlug(null)
    window.history.replaceState(
      { layer: 'notes', noteSlug: null },
      '',
      appUrlForRoute('notes', null),
    )
  }, [])

  const closeLayer = useCallback(() => {
    setActiveLayer(null)
    setNoteSlug(null)
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const moveHorizontally = useCallback(
    (direction) => {
      if (activeLayer === 'notes' || activeLayer === 'elsewhere') {
        closeLayer()
        return true
      }

      openLayer(direction < 0 ? 'notes' : 'elsewhere')
      return true
    },
    [activeLayer, closeLayer, openLayer],
  )

  activeLayerRef.current = activeLayer
  closeLayerRef.current = closeLayer
  moveHorizontallyRef.current = moveHorizontally

  const lockInput = useCallback((duration) => {
    wheelLockedRef.current = true
    window.setTimeout(() => {
      wheelLockedRef.current = false
    }, duration)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && activeLayer) {
        if (noteSlug) backToNotes()
        else closeLayer()
        return
      }
      if (event.key === 'ArrowLeft') {
        moveHorizontally(-1)
        return
      }
      if (event.key === 'ArrowRight') {
        moveHorizontally(1)
        return
      }
      if (activeLayer) return
      if (event.key === 'Escape' && level > LEVEL.artist) goBack()
      if (event.key === 'ArrowUp') {
        setLevel((current) => Math.max(LEVEL.artist, current - 1))
      }
      if (event.key === 'ArrowDown') {
        setLevel((current) => Math.min(LEVEL.lyrics, current + 1))
      }
    }
    const onWheel = (event) => {
      const horizontalDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.shiftKey
            ? event.deltaY
            : 0

      if (Math.abs(horizontalDelta) >= 20) {
        if (wheelLockedRef.current) return
        if (moveHorizontally(horizontalDelta > 0 ? 1 : -1)) {
          lockInput(700)
        }
        return
      }

      if (activeLayer) return
      if (Math.abs(event.deltaY) < 20 || wheelLockedRef.current) return

      lockInput(900)
      setLevel((current) => {
        const direction = event.deltaY > 0 ? 1 : -1
        return Math.max(LEVEL.artist, Math.min(LEVEL.lyrics, current + direction))
      })
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('wheel', onWheel)
    }
  }, [
    activeLayer,
    backToNotes,
    closeLayer,
    goBack,
    level,
    lockInput,
    moveHorizontally,
    noteSlug,
  ])

  useEffect(() => {
    const onTouchStart = (event) => {
      if (event.touches.length !== 1) {
        touchStartRef.current = null
        return
      }

      const touch = event.touches[0]
      const startedOnNav = Boolean(
        touch.target instanceof Element &&
          touch.target.closest('.reading-navigation, .reading-desktop-return'),
      )

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        startedAt: performance.now(),
        startedOnNav,
        wasScrolling: false,
      }
    }

    const onTouchMove = (event) => {
      const start = touchStartRef.current
      if (!start || start.wasScrolling || event.touches.length !== 1) return

      const touch = event.touches[0]
      const deltaY = touch.clientY - start.y
      const deltaX = touch.clientX - start.x

      if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX)) {
        start.wasScrolling = true
      }
    }

    const onTouchCancel = () => {
      touchStartRef.current = null
    }

    const onTouchEnd = (event) => {
      const start = touchStartRef.current
      touchStartRef.current = null
      if (!start || event.changedTouches.length !== 1) return
      if (start.startedOnNav || wheelLockedRef.current) return

      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - start.x
      const deltaY = touch.clientY - start.y
      const distance = Math.hypot(deltaX, deltaY)
      const elapsed = performance.now() - start.startedAt
      const layer = activeLayerRef.current

      if (distance < 40 || elapsed > 1200) return

      const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.1
      const vertical = Math.abs(deltaY) > Math.abs(deltaX) * 1.1

      if (layer && horizontal && !start.wasScrolling) {
        closeLayerRef.current()
        lockInput(700)
        return
      }

      if (!horizontal && !vertical) return

      if (horizontal) {
        if (moveHorizontallyRef.current(deltaX < 0 ? 1 : -1)) {
          lockInput(700)
        }
        return
      }

      if (!layer && vertical) {
        lockInput(700)
        setLevel((current) => {
          const direction = deltaY < 0 ? 1 : -1
          return Math.max(
            LEVEL.artist,
            Math.min(LEVEL.lyrics, current + direction),
          )
        })
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [lockInput])

  useEffect(() => {
    trackPageView(getAnalyticsPath(level, activeLayer, noteSlug))
  }, [level, activeLayer, noteSlug])

  useEffect(() => {
    const syncReadingRoute = () => {
      const route = parseReadingRoute()
      setActiveLayer(route.layer)
      setNoteSlug(route.noteSlug)
    }
    window.addEventListener('hashchange', syncReadingRoute)
    window.addEventListener('popstate', syncReadingRoute)
    return () => {
      window.removeEventListener('hashchange', syncReadingRoute)
      window.removeEventListener('popstate', syncReadingRoute)
    }
  }, [])

  const enterRelease = () => setLevel(LEVEL.release)
  const enterLyrics = () => setLevel(LEVEL.lyrics)

  return (
    <main className={`experience level-${level}`}>
      <Starfield level={level} paused={activeLayer !== null} />
      <Atmosphere lyricsVisible={level === LEVEL.lyrics} />
      <EdgeNavigation
        visible={level === LEVEL.artist}
        activeLayer={activeLayer}
        onOpen={openLayer}
      />

      <button
        className={`icon-button back-button ${level > LEVEL.artist ? 'is-visible' : ''}`}
        type="button"
        aria-label="Go back"
        onClick={goBack}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      <section
        className={`center-view artist-view ${level === LEVEL.artist ? 'is-active' : ''}`}
        aria-hidden={level !== LEVEL.artist}
      >
        <button className="title-button artist-name" onClick={enterRelease}>
          <span className="meteor-scroll-cue" aria-hidden="true">
            <span className="meteor-scroll-line" />
            <span className="meteor-scroll-head" />
            <span className="meteor-scroll-direction">
              <i />
              <i />
              <i />
            </span>
          </span>
          <span>
            new<sup>2</sup><span className="artist-name-ords">ords</span>
          </span>
          <small className="title-invitation">
            <span aria-hidden="true">—</span> enter <span aria-hidden="true">—</span>
          </small>
        </button>
      </section>

      <section
        className={`center-view song-view ${level === LEVEL.release ? 'is-active' : ''}`}
        aria-hidden={level !== LEVEL.release}
      >
        <button className="title-button song-name" onClick={enterLyrics}>
          <span className="meteor-scroll-cue" aria-hidden="true">
            <span className="meteor-scroll-line" />
            <span className="meteor-scroll-head" />
            <span className="meteor-scroll-direction">
              <i />
              <i />
              <i />
            </span>
          </span>
          <span>{artist.release.title}</span>
          <small className="title-invitation">
            <span aria-hidden="true">—</span> listen <span aria-hidden="true">—</span>
          </small>
        </button>
      </section>

      <LyricsGalaxy
        lyrics={artist.release.lyrics}
        visible={level === LEVEL.lyrics}
        playback={playback}
        offsetSeconds={artist.release.lyricOffsetMs / 1000}
      />

      <CassettePlayer
        bandcampTrackId={artist.release.bandcampTrackId}
        bandcampUrl={artist.links.bandcampMeteor}
        videoId={artist.release.youtubeVideoId}
        visible={level === LEVEL.lyrics}
        playback={playback}
        onPlaybackSample={updatePlayback}
      />

      <ReadingLayer
        layer={activeLayer}
        noteSlug={noteSlug}
        onClose={closeLayer}
        onNavigate={openLayer}
        onOpenNote={openNote}
        onBackToNotes={backToNotes}
      />
    </main>
  )
}
