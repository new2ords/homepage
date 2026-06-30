import { useCallback, useEffect, useRef, useState } from 'react'
import Atmosphere from './components/Atmosphere'
import CassettePlayer from './components/CassettePlayer'
import EdgeNavigation from './components/EdgeNavigation'
import LyricsGalaxy from './components/LyricsGalaxy'
import ReadingLayer from './components/ReadingLayer'
import ReleaseGalaxyMenu from './components/ReleaseGalaxyMenu'
import Starfield from './components/Starfield'
import YouTubePlayer from './components/YouTubePlayer'
import { artist } from './data/artist'
import { useReadingNavigation } from './hooks/useReadingNavigation'
import { getAnalyticsPath, trackPageView } from './lib/analytics'

const VIEW = {
  home: 'home',
  release: 'release',
  lyrics: 'lyrics',
  live: 'live',
}

const LEVEL = {
  artist: 0,
  release: 1,
  lyrics: 2,
}

const SIGNAL = {
  meteor: 0,
  live: 1,
}

const THEME = {
  dark: 'dark',
  light: 'light',
}

function levelForView(view) {
  if (view === VIEW.lyrics) return LEVEL.lyrics
  if (view === VIEW.release || view === VIEW.live) return LEVEL.release
  return LEVEL.artist
}

export default function App() {
  const [view, setView] = useState(() => getInitialView())
  const [theme, setTheme] = useState(() => getInitialTheme())
  const [activeSignal, setActiveSignal] = useState(() =>
    getInitialView() === VIEW.live ? SIGNAL.live : SIGNAL.meteor,
  )
  const {
    activeLayer,
    noteSlug,
    openLayer,
    openNote,
    backToNotes,
    closeLayer,
  } = useReadingNavigation()
  const [playback, setPlayback] = useState({
    time: 0,
    duration: 0,
    sampledAt: 0,
    playing: false,
    buffering: false,
  })
  const [releaseMotion, setReleaseMotion] = useState({ step: 0, direction: 0 })
  const wheelLockedRef = useRef(false)
  const inputLockTimeoutRef = useRef(null)
  const releaseWheelIntentRef = useRef(0)
  const releaseWheelResetRef = useRef(null)
  const touchStartRef = useRef(null)
  const suppressClickUntilRef = useRef(0)
  const activeLayerRef = useRef(activeLayer)
  const viewRef = useRef(view)
  const activeSignalRef = useRef(activeSignal)
  const moveReadingHorizontallyRef = useRef(() => false)
  const level = levelForView(view)
  const releaseVisible = view === VIEW.release || view === VIEW.live

  activeLayerRef.current = activeLayer
  viewRef.current = view
  activeSignalRef.current = activeSignal

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === THEME.light ? '#f4efe4' : '#070706')
    window.localStorage.setItem('new2ords-theme', theme)
  }, [theme])

  const updatePlayback = useCallback((sample) => {
    setPlayback(sample)
  }, [])

  const moveReadingHorizontally = useCallback(
    (direction) => {
      if (activeLayer === 'notes') {
        if (direction < 0) return false
        closeLayer()
        return true
      }

      if (activeLayer === 'elsewhere') {
        if (direction > 0) return false
        closeLayer()
        return true
      }

      openLayer(direction < 0 ? 'notes' : 'elsewhere')
      return true
    },
    [activeLayer, closeLayer, openLayer],
  )

  moveReadingHorizontallyRef.current = moveReadingHorizontally

  const lockInput = useCallback((duration) => {
    wheelLockedRef.current = true
    if (inputLockTimeoutRef.current) {
      window.clearTimeout(inputLockTimeoutRef.current)
    }
    inputLockTimeoutRef.current = window.setTimeout(() => {
      wheelLockedRef.current = false
      inputLockTimeoutRef.current = null
    }, duration)
  }, [])

  const travelToSignal = useCallback((nextSignal) => {
    const clamped = Math.max(SIGNAL.meteor, Math.min(SIGNAL.live, nextSignal))
    const direction = clamped - activeSignalRef.current
    if (!direction) return false

    setActiveSignal(clamped)
    setReleaseMotion((current) => ({
      step: current.step + 1,
      direction,
      intensity: 1,
      kind: 'travel',
    }))
    return true
  }, [])

  const pulseUniverse = useCallback((kind, direction = 1) => {
    setReleaseMotion((current) => ({
      step: current.step + 1,
      direction,
      intensity: 1,
      kind,
    }))
  }, [])

  const activateSignal = useCallback(() => {
    pulseUniverse('enter', activeSignalRef.current === SIGNAL.live ? 0.6 : 1)
    if (activeSignalRef.current === SIGNAL.live) {
      setActiveSignal(SIGNAL.live)
      setView(VIEW.live)
      return
    }

    setActiveSignal(SIGNAL.meteor)
    setView(VIEW.lyrics)
  }, [pulseUniverse])

  const goRelease = useCallback((signal = SIGNAL.meteor) => {
    setActiveSignal(signal)
    setView(VIEW.release)
  }, [])

  const goBack = useCallback(() => {
    const currentView = viewRef.current
    if (currentView === VIEW.live) {
      pulseUniverse('exit', -0.6)
      goRelease(SIGNAL.live)
      return
    }
    if (currentView === VIEW.lyrics) {
      pulseUniverse('exit', -1)
      goRelease(SIGNAL.meteor)
      return
    }
    if (currentView === VIEW.release) {
      pulseUniverse('exit', -0.45)
      setView(VIEW.home)
    }
  }, [goRelease, pulseUniverse])

  useEffect(
    () => () => {
      if (inputLockTimeoutRef.current) {
        window.clearTimeout(inputLockTimeoutRef.current)
      }
      if (releaseWheelResetRef.current) {
        window.clearTimeout(releaseWheelResetRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && activeLayer) {
        if (noteSlug) backToNotes()
        else closeLayer()
        return
      }

      if (activeLayer) {
        if (event.key === 'ArrowLeft') moveReadingHorizontally(-1)
        if (event.key === 'ArrowRight') moveReadingHorizontally(1)
        return
      }

      if (view === VIEW.home) {
        if (event.key === 'ArrowLeft') moveReadingHorizontally(-1)
        if (event.key === 'ArrowRight') moveReadingHorizontally(1)
        if (event.key === 'ArrowDown') goRelease(SIGNAL.meteor)
        return
      }

      if (view === VIEW.release) {
        if (event.key === 'Escape' || event.key === 'ArrowUp') {
          pulseUniverse('exit', -0.45)
          setView(VIEW.home)
          return
        }
        if (event.key === 'ArrowLeft') travelToSignal(activeSignalRef.current - 1)
        if (event.key === 'ArrowRight') travelToSignal(activeSignalRef.current + 1)
        if (event.key === 'ArrowDown' || event.key === 'Enter') activateSignal()
        return
      }

      if (event.key === 'Escape' || event.key === 'ArrowUp') {
        goBack()
      }
    }

    const onWheel = (event) => {
      const horizontalDelta = getHorizontalWheelDelta(event)

      if (activeLayer) {
        if (Math.abs(horizontalDelta) >= 20 && !wheelLockedRef.current) {
          if (moveReadingHorizontally(horizontalDelta > 0 ? 1 : -1)) {
            lockInput(700)
          }
        }
        return
      }

      if (view === VIEW.home) {
        if (Math.abs(horizontalDelta) >= 20) {
          if (wheelLockedRef.current) return
          if (moveReadingHorizontally(horizontalDelta > 0 ? 1 : -1)) {
            lockInput(700)
          }
          return
        }

        if (event.deltaY > 20 && !wheelLockedRef.current) {
          pulseUniverse('enter', 0.5)
          goRelease(SIGNAL.meteor)
          lockInput(560)
        }
        return
      }

      if (view === VIEW.release) {
        if (Math.abs(horizontalDelta) >= 4) {
          releaseWheelIntentRef.current += horizontalDelta
          if (releaseWheelResetRef.current) {
            window.clearTimeout(releaseWheelResetRef.current)
          }
          releaseWheelResetRef.current = window.setTimeout(() => {
            releaseWheelIntentRef.current = 0
          }, 180)

          if (
            Math.abs(releaseWheelIntentRef.current) >= 34 &&
            !wheelLockedRef.current
          ) {
            const direction = releaseWheelIntentRef.current > 0 ? 1 : -1
            releaseWheelIntentRef.current = 0
            if (travelToSignal(activeSignalRef.current + direction)) {
              lockInput(680)
            }
          }
          return
        }

        if (event.deltaY < -20 && !wheelLockedRef.current) {
          pulseUniverse('exit', -0.45)
          setView(VIEW.home)
          lockInput(640)
          return
        }

        if (event.deltaY > 20 && !wheelLockedRef.current) {
          activateSignal()
          lockInput(640)
        }
        return
      }

      if (event.deltaY < -20 && !wheelLockedRef.current) {
        goBack()
        lockInput(640)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('wheel', onWheel)
    }
  }, [
    activeLayer,
    activateSignal,
    backToNotes,
    closeLayer,
    goBack,
    goRelease,
    lockInput,
    moveReadingHorizontally,
    noteSlug,
    pulseUniverse,
    travelToSignal,
    view,
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

    const suppressGhostClick = () => {
      suppressClickUntilRef.current = performance.now() + 500
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
      const currentView = viewRef.current

      if (distance < 40 || elapsed > 1200) return

      const horizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.1
      const vertical = Math.abs(deltaY) > Math.abs(deltaX) * 1.1

      if (layer && horizontal && !start.wasScrolling) {
        const direction = deltaX < 0 ? 1 : -1
        if (moveReadingHorizontallyRef.current(direction)) {
          suppressGhostClick()
          lockInput(700)
        }
        return
      }

      if (!horizontal && !vertical) return

      if (currentView === VIEW.home) {
        if (horizontal) {
          suppressGhostClick()
          if (moveReadingHorizontallyRef.current(deltaX < 0 ? 1 : -1)) {
            lockInput(700)
          }
          return
        }

        if (vertical && deltaY < 0) {
          suppressGhostClick()
          goRelease(SIGNAL.meteor)
          lockInput(620)
        }
        return
      }

      if (currentView === VIEW.release) {
        suppressGhostClick()
        if (horizontal) {
          travelToSignal(activeSignalRef.current + (deltaX < 0 ? 1 : -1))
          lockInput(680)
          return
        }
        if (vertical && deltaY > 0) {
          pulseUniverse('exit', -0.45)
          setView(VIEW.home)
          lockInput(640)
          return
        }
        if (vertical && deltaY < 0) {
          activateSignal()
          lockInput(640)
        }
        return
      }

      if (vertical && deltaY > 0) {
        suppressGhostClick()
        goBack()
        lockInput(640)
      }
    }

    const onClick = (event) => {
      if (performance.now() >= suppressClickUntilRef.current) return
      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })
    window.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
      window.removeEventListener('click', onClick, true)
    }
  }, [activateSignal, goBack, goRelease, lockInput, pulseUniverse, travelToSignal])

  useEffect(() => {
    trackPageView(getAnalyticsPath(level, activeLayer, noteSlug))
  }, [level, activeLayer, noteSlug])

  const enterRelease = useCallback(() => goRelease(SIGNAL.meteor), [goRelease])
  const enterLyrics = useCallback(() => {
    pulseUniverse('enter', 1)
    setActiveSignal(SIGNAL.meteor)
    setView(VIEW.lyrics)
  }, [pulseUniverse])
  const enterLiveRoom = useCallback(() => {
    pulseUniverse('enter', 0.6)
    setActiveSignal(SIGNAL.live)
    setView(VIEW.live)
  }, [pulseUniverse])
  const selectReleaseSignal = useCallback(
    (signal) => {
      if (viewRef.current === VIEW.live) {
        pulseUniverse('exit', signal === SIGNAL.live ? -0.4 : -0.75)
        setActiveSignal(signal)
        setView(VIEW.release)
        return true
      }

      return travelToSignal(signal)
    },
    [pulseUniverse, travelToSignal],
  )
  const closeLiveRoom = useCallback(() => {
    pulseUniverse('exit', -0.6)
    goRelease(SIGNAL.live)
  }, [goRelease, pulseUniverse])
  const hoverSignal = useCallback((signal) => {
    const direction = signal - activeSignalRef.current
    setReleaseMotion((current) => ({
      step: current.step + 1,
      direction: direction || 0.35,
      intensity: 0.2,
      kind: 'hover',
    }))
  }, [])
  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === THEME.light ? THEME.dark : THEME.light))
  }, [])

  return (
    <main className={`experience level-${level}`} data-theme={theme}>
      <Starfield
        level={level}
        paused={activeLayer !== null}
        releaseMotion={releaseMotion}
        activeSignal={activeSignal}
        view={view}
        theme={theme}
      />
      <Atmosphere lyricsVisible={level === LEVEL.lyrics || releaseVisible} />
      <EdgeNavigation
        visible={view === VIEW.home}
        activeLayer={activeLayer}
        onOpen={openLayer}
      />

      <button
        className={`icon-button back-button ${view !== VIEW.home ? 'is-visible' : ''}`}
        type="button"
        aria-label="Go back"
        tabIndex={view !== VIEW.home && !activeLayer ? undefined : -1}
        onClick={goBack}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      <button
        className="theme-toggle"
        type="button"
        aria-label={`Switch to ${theme === THEME.light ? 'dark' : 'light'} mode`}
        aria-pressed={theme === THEME.light}
        onClick={toggleTheme}
      >
        <span className="theme-toggle-orbit" aria-hidden="true">
          <span className="theme-toggle-body" />
        </span>
      </button>

      <section
        className={`center-view artist-view ${view === VIEW.home ? 'is-active' : ''}`}
        aria-hidden={view !== VIEW.home}
      >
        <button
          className="title-button artist-name"
          tabIndex={view === VIEW.home && !activeLayer ? undefined : -1}
          onClick={enterRelease}
        >
          <span className="meteor-scroll-cue" aria-hidden="true">
            <span className="meteor-scroll-motion">
              <span className="meteor-scroll-line" />
              <span className="meteor-scroll-head" />
              <span className="meteor-scroll-direction">
                <i />
                <i />
                <i />
              </span>
            </span>
          </span>
          <span>
            new<sup>2</sup><span className="artist-name-ords">ords</span>
          </span>
        </button>
      </section>

      <LyricsGalaxy
        lyrics={artist.release.lyrics}
        visible={view === VIEW.lyrics}
        playback={playback}
        offsetSeconds={artist.release.lyricOffsetMs / 1000}
      />

      <ReleaseGalaxyMenu
        visible={releaseVisible}
        liveActive={view === VIEW.live}
        activeIndex={activeSignal}
        onSelect={selectReleaseSignal}
        onActivate={activateSignal}
        onEnterLyrics={enterLyrics}
        onEnterLive={enterLiveRoom}
        onHover={hoverSignal}
      />

      <section
        className={`live-room-player ${view === VIEW.live ? 'is-visible' : ''}`}
        aria-hidden={view !== VIEW.live}
        inert={view !== VIEW.live}
        onWheelCapture={(event) => {
          if (event.deltaY < -20) closeLiveRoom()
        }}
      >
        <button
          className="live-room-close text-button"
          type="button"
          onClick={closeLiveRoom}
        >
          back to signals
        </button>
        <div className="live-room-video-stage">
          <YouTubePlayer
            videoId={artist.release.liveRoom.youtubeVideoId}
            title={artist.release.liveRoom.title}
            caption={artist.release.liveRoom.caption}
            visible={view === VIEW.live}
            chromeless
          />
        </div>
      </section>

      <CassettePlayer
        bandcampTrackId={artist.release.bandcampTrackId}
        bandcampUrl={artist.links.bandcampMeteor}
        videoId={artist.release.youtubeVideoId}
        title={artist.release.title}
        visible={view === VIEW.lyrics}
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

function getHorizontalWheelDelta(event) {
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY) * 0.65) {
    return event.deltaX
  }
  return event.shiftKey ? event.deltaY : 0
}

function getInitialView() {
  const queryView = new URLSearchParams(window.location.search).get('view')
  if (queryView === 'live') return VIEW.live
  if (queryView === 'release' || queryView === 'videos') return VIEW.release
  if (queryView === 'lyrics') return VIEW.lyrics
  return VIEW.home
}

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem('new2ords-theme')
  if (savedTheme === THEME.light || savedTheme === THEME.dark) {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? THEME.light
    : THEME.dark
}
