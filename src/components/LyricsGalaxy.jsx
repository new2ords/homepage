import { useEffect, useMemo, useRef, useState } from 'react'
import { mulberry32 } from '../lib/random'

function findActiveLyric(lyrics, time) {
  let low = 0
  let high = lyrics.length - 1
  let result = -1

  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const start = lyrics[middle].start

    if (start === null || start > time) {
      high = middle - 1
    } else {
      result = middle
      low = middle + 1
    }
  }

  return result
}

export default function LyricsGalaxy({
  lyrics,
  visible,
  playback,
  offsetSeconds,
}) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [line, setLine] = useState(null)
  const wordRefs = useRef([])
  const activeIndexRef = useRef(-1)
  const hasTimings = lyrics.some((lyric) => lyric.start !== null)

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
    }
  }, [visible])

  useEffect(() => {
    if (!visible || !hasTimings) return undefined
    let frameId

    const render = () => {
      const elapsed = playback.playing
        ? (performance.now() - playback.sampledAt) / 1000
        : 0
      const estimatedTime = playback.time + elapsed + offsetSeconds
      const nextIndex = findActiveLyric(lyrics, estimatedTime)

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

      frameId = window.requestAnimationFrame(render)
    }

    render()
    return () => window.cancelAnimationFrame(frameId)
  }, [hasTimings, lyrics, offsetSeconds, playback, visible])

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
