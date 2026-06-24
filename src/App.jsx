import { useCallback, useEffect, useRef, useState } from 'react'
import Atmosphere from './components/Atmosphere'
import CassettePlayer from './components/CassettePlayer'
import LyricsGalaxy from './components/LyricsGalaxy'
import Starfield from './components/Starfield'
import { artist } from './data/artist'

const LEVEL = {
  artist: 0,
  release: 1,
  lyrics: 2,
}

export default function App() {
  const [level, setLevel] = useState(LEVEL.artist)
  const [playback, setPlayback] = useState({
    time: 0,
    duration: 0,
    sampledAt: 0,
    playing: false,
    buffering: false,
  })
  const wheelLockedRef = useRef(false)

  const goBack = useCallback(() => {
    setLevel((current) => Math.max(LEVEL.artist, current - 1))
  }, [])

  const updatePlayback = useCallback((sample) => {
    setPlayback(sample)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && level > LEVEL.artist) goBack()
      if (event.key === 'ArrowUp') {
        setLevel((current) => Math.max(LEVEL.artist, current - 1))
      }
      if (event.key === 'ArrowDown') {
        setLevel((current) => Math.min(LEVEL.lyrics, current + 1))
      }
    }
    const onWheel = (event) => {
      if (Math.abs(event.deltaY) < 20 || wheelLockedRef.current) return

      wheelLockedRef.current = true
      setLevel((current) => {
        const direction = event.deltaY > 0 ? 1 : -1
        return Math.max(LEVEL.artist, Math.min(LEVEL.lyrics, current + direction))
      })
      window.setTimeout(() => {
        wheelLockedRef.current = false
      }, 900)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('wheel', onWheel)
    }
  }, [goBack, level])

  const enterRelease = () => setLevel(LEVEL.release)
  const enterLyrics = () => setLevel(LEVEL.lyrics)

  return (
    <main className={`experience level-${level}`}>
      <Starfield level={level} />
      <Atmosphere lyricsVisible={level === LEVEL.lyrics} />

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
          new<sup>2</sup>ords
        </button>
      </section>

      <section
        className={`center-view song-view ${level === LEVEL.release ? 'is-active' : ''}`}
        aria-hidden={level !== LEVEL.release}
      >
        <button className="title-button song-name" onClick={enterLyrics}>
          {artist.release.title}
        </button>
      </section>

      <LyricsGalaxy
        lyrics={artist.release.lyrics}
        visible={level === LEVEL.lyrics}
        playback={playback}
        offsetSeconds={artist.release.lyricOffsetMs / 1000}
      />

      <CassettePlayer
        videoId={artist.release.youtubeVideoId}
        visible={level === LEVEL.lyrics}
        onPlaybackSample={updatePlayback}
      />

      <p className="navigation-hint" aria-hidden="true">
        {level === LEVEL.artist
          ? 'click or scroll to enter'
          : level === LEVEL.release
            ? 'click or scroll to listen'
            : 'scroll up or esc to return'}
      </p>
    </main>
  )
}
