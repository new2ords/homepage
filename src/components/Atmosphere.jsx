import { atmosphereWords, marginalia } from '../data/artist'
import { mulberry32 } from '../lib/random'

const random = mulberry32(441)
const driftingWords = atmosphereWords.map((word, index) => ({
  word,
  left: `${random() * 100}%`,
  top: `${random() * 100}%`,
  x: `${(random() - 0.5) * 180}px`,
  y: `${(random() - 0.5) * 180}px`,
  duration: `${25 + random() * 20}s`,
  delay: `${index * -3}s`,
}))

const notes = marginalia.slice(0, 6).map((note, index) => ({
  note,
  left: index % 2 === 0 ? `${7 + random() * 10}%` : `${80 + random() * 10}%`,
  top: `${15 + random() * 70}%`,
  delay: `${index * 4.5}s`,
}))

export default function Atmosphere({ lyricsVisible }) {
  return (
    <>
      <div className="grain-overlay" />
      <div className="vignette-overlay" />
      <div className="chromatic-overlay" />
      <div className="drifting-words" aria-hidden="true">
        {driftingWords.map((item) => (
          <span
            key={item.word}
            style={{
              left: item.left,
              top: item.top,
              '--drift-x': item.x,
              '--drift-y': item.y,
              '--drift-duration': item.duration,
              '--drift-delay': item.delay,
            }}
          >
            {item.word}
          </span>
        ))}
      </div>
      <div
        className={`marginalia-layer ${lyricsVisible ? 'is-visible' : ''}`}
        aria-hidden="true"
      >
        {notes.map((item) => (
          <span
            key={`${item.note}-${item.delay}`}
            style={{ left: item.left, top: item.top, '--note-delay': item.delay }}
          >
            {item.note}
          </span>
        ))}
      </div>
    </>
  )
}
