import { useEffect, useMemo, useRef, useState } from 'react'
import { mulberry32 } from '../lib/random'

export default function LyricsGalaxy({
  lyrics,
  visible,
}) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [line, setLine] = useState(null)
  const wordRefs = useRef([])
  const activeIndexRef = useRef(-1)
  const timerRef = useRef(null)
  const randomRef = useRef(mulberry32(20260623))
  const hasLyrics = lyrics.length > 0

  const positions = useMemo(() => {
    const random = mulberry32(777)
    return lyrics.map((_, index) => {
      const angle = random() * Math.PI * 2
      const radius = 12 + random() * 39
      return {
        left: `${50 + Math.cos(angle) * radius}%`,
        top: `${50 + Math.sin(angle) * radius}%`,
        size: `${0.88 + random() * 0.52}rem`,
        delay: `${random() * -18}s`,
        x: `${(random() - 0.5) * 70}px`,
        y: `${(random() - 0.5) * 70}px`,
        key: `${index}-${random()}`,
      }
    })
  }, [lyrics])

  useEffect(() => {
    if (!visible) {
      activeIndexRef.current = -1
      setActiveIndex(-1)
      setLine(null)
      window.clearTimeout(timerRef.current)
    }
  }, [visible])

  useEffect(() => {
    if (!visible || !hasLyrics) return undefined

    const animate = () => {
      if (!lyrics.length) return

      const nextIndex = pickNextIndex(lyrics.length)
      if (nextIndex !== activeIndexRef.current) {
        const previousIndex = activeIndexRef.current
        activeIndexRef.current = nextIndex
        setActiveIndex(nextIndex)

        const previous = wordRefs.current[previousIndex]?.getBoundingClientRect()
        const current = wordRefs.current[nextIndex]?.getBoundingClientRect()
        if (previous && current) {
          setLine({
            x1: previous.left + previous.width / 2,
            y1: previous.top + previous.height / 2,
            x2: current.left + current.width / 2,
            y2: current.top + current.height / 2,
          })
        } else {
          setLine(null)
        }
      }

      const nextDelay = 700 + randomRef.current() * 1100
      timerRef.current = window.setTimeout(animate, nextDelay)
    }

    animate()
    return () => window.clearTimeout(timerRef.current)
  }, [hasLyrics, lyrics, visible])

  return (
    <div
      className={`lyrics-galaxy ${visible ? 'is-visible' : ''}`}
      aria-hidden={!visible}
    >
      <svg className="constellation" aria-hidden="true">
        {line && <line {...line} />}
      </svg>
      {lyrics.map((lyric, index) => (
        <span
          className={`lyric-word ${index === activeIndex ? 'is-active' : ''}`}
          key={positions[index].key}
          ref={(element) => {
            wordRefs.current[index] = element
          }}
          style={{
            left: positions[index].left,
            top: positions[index].top,
            fontSize: positions[index].size,
            '--float-delay': positions[index].delay,
            '--float-x': positions[index].x,
            '--float-y': positions[index].y,
          }}
        >
          {lyric.text}
        </span>
      ))}
    </div>
  )
}

function pickNextIndex(length) {
  if (length <= 1) return 0
  return Math.floor(Math.random() * length)
}
