import { useEffect, useMemo, useRef, useState } from 'react'
import { artist } from '../data/artist'
import './lyric-timing-tool.css'

export default function LyricTimingTool() {
  const audioRef = useRef(null)
  const objectUrlRef = useRef(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [syncOffsetMs, setSyncOffsetMs] = useState(0)
  const [timestamps, setTimestamps] = useState(() =>
    artist.release.lyrics.map((lyric) => lyric.start),
  )
  const nextIndex = timestamps.findIndex((time) => time === null)
  const activeIndex = nextIndex === -1 ? timestamps.length : nextIndex

  const exportText = useMemo(
    () =>
      artist.release.lyrics
        .map(
          (lyric, index) =>
            `['${escapeText(lyric.text)}', ${
              timestamps[index] === null ? 'null' : timestamps[index].toFixed(3)
            }]`,
        )
        .join(',\n'),
    [timestamps],
  )

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    },
    [],
  )

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLButtonElement
      ) {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        markCurrentWord()
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const chooseAudio = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)

    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setAudioUrl(url)
    setFileName(file.name)
  }

  const markCurrentWord = () => {
    if (!audioRef.current || activeIndex >= timestamps.length) return
    const time = audioRef.current.currentTime + syncOffsetMs / 1000
    setTimestamps((current) =>
      current.map((value, index) => (index === activeIndex ? time : value)),
    )
  }

  const nudgeOffset = (deltaMs) => {
    setSyncOffsetMs((current) => current + deltaMs)
  }

  const undo = () => {
    setTimestamps((current) => {
      const lastMarked = current.findLastIndex((time) => time !== null)
      if (lastMarked === -1) return current
      return current.map((value, index) => (index === lastMarked ? null : value))
    })
  }

  const reset = () => {
    if (window.confirm('Clear every timestamp?')) {
      setTimestamps(artist.release.lyrics.map(() => null))
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(exportText)
  }

  return (
    <main className="timing-tool">
      <header>
        <p>local authoring tool</p>
        <h1>meteor timing</h1>
        <a href="/">return to site</a>
      </header>

      <section className="timing-audio">
        <label>
          <span>choose the local song file</span>
          <input type="file" accept="audio/*" onChange={chooseAudio} />
        </label>
        <p>{fileName || 'No audio selected. The file never leaves this browser.'}</p>
        {audioUrl && <audio ref={audioRef} src={audioUrl} controls preload="metadata" />}
        <div className="timing-sync">
          <span>sync offset</span>
          <strong>{formatOffset(syncOffsetMs)}</strong>
          <div>
            <button type="button" onClick={() => nudgeOffset(-50)}>
              -50ms
            </button>
            <button type="button" onClick={() => nudgeOffset(50)}>
              +50ms
            </button>
            <button type="button" onClick={() => nudgeOffset(-200)}>
              -200ms
            </button>
            <button type="button" onClick={() => nudgeOffset(200)}>
              +200ms
            </button>
          </div>
        </div>
      </section>

      <section className="timing-workspace">
        <div className="timing-current">
          <p>
            {Math.min(activeIndex, timestamps.length)} / {timestamps.length}
          </p>
          <strong>
            {activeIndex < artist.release.lyrics.length
              ? artist.release.lyrics[activeIndex].text
              : 'complete'}
          </strong>
          <span>Press space when this word begins.</span>
          <div>
            <button type="button" onClick={markCurrentWord} disabled={!audioUrl}>
              mark word
            </button>
            <button type="button" onClick={undo}>undo</button>
          </div>
        </div>

        <ol className="timing-lyrics">
          {artist.release.lyrics.map((lyric, index) => (
            <li
              className={
                index === activeIndex
                  ? 'is-current'
                  : timestamps[index] !== null
                    ? 'is-marked'
                    : ''
              }
              key={`${lyric.text}-${index}`}
            >
              <span>{lyric.text}</span>
              <output>
                {timestamps[index] === null ? '—' : timestamps[index].toFixed(3)}
              </output>
            </li>
          ))}
        </ol>
      </section>

      <section className="timing-export">
        <div>
          <h2>finished timing</h2>
          <p>Copy this over the lyrics array in src/data/artist.js.</p>
          <p>
            Use the offset above if the whole line feels early or late. Paste
            it into <code>lyricOffsetMs</code>.
          </p>
        </div>
        <div className="timing-actions">
          <button type="button" onClick={copy}>copy timestamps</button>
          <button type="button" onClick={reset}>clear all</button>
        </div>
        <textarea value={exportText} readOnly rows="14" />
      </section>
    </main>
  )
}

function escapeText(text) {
  return text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

function formatOffset(value) {
  const sign = value >= 0 ? '+' : '-'
  const absolute = Math.abs(value)
  return `${sign}${absolute}ms`
}
