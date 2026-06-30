import { useMemo, useState } from 'react'

export default function ReleaseGalaxyMenu({
  visible,
  liveActive,
  activeIndex,
  onSelect,
  onActivate,
  onEnterLyrics,
  onEnterLive,
  onHover,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const signals = useMemo(
    () => [
      {
        id: 'meteor',
        title: 'meteor',
        action: onEnterLyrics,
      },
      {
        id: 'live',
        title: 'live from the room',
        action: onEnterLive,
      },
    ],
    [onEnterLive, onEnterLyrics],
  )

  const hoverSignal = (index) => {
    setHoveredIndex(index)
    onHover?.(index)
  }

  return (
    <section
      className={`release-galaxy ${visible ? 'is-visible' : ''} ${
        liveActive ? 'has-live-open' : ''
      }`}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="release-signal-track" aria-label="Release paths">
        {signals.map((signal, index) => {
          const offset = index - activeIndex
          const active = offset === 0
          const hovered = hoveredIndex === index
          return (
            <button
              className={`release-signal ${active ? 'is-active' : ''} ${
                hovered ? 'is-hovered' : ''
              }`}
              key={signal.id}
              style={{
                '--signal-x': `${offset * 34}vw`,
                '--signal-scale': active ? 1 : 0.72,
                '--signal-opacity': active ? 1 : 0.42,
              }}
              type="button"
              onClick={() => {
                if (active) onActivate()
                else onSelect(index)
              }}
              onBlur={() => setHoveredIndex(null)}
              onFocus={() => hoverSignal(index)}
              onPointerEnter={() => hoverSignal(index)}
              onPointerLeave={() => setHoveredIndex(null)}
            >
              <span className="release-signal-title">{signal.title}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
