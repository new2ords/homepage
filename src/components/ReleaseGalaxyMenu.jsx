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
        title: 'from the room',
        action: onEnterLive,
        disabled: true,
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
          const disabled = signal.disabled
          const hovered = hoveredIndex === index && !disabled
          return (
            <button
              className={`release-signal ${active ? 'is-active' : ''} ${
                hovered ? 'is-hovered' : ''
              } ${disabled ? 'is-disabled' : ''}`}
              key={signal.id}
              aria-disabled={disabled}
              disabled={disabled}
              style={{
                '--signal-x': `${offset * 34}vw`,
                '--signal-scale': active ? 1 : 0.72,
                '--signal-opacity': disabled ? 0.28 : active ? 1 : 0.42,
              }}
              type="button"
              onClick={() => {
                if (disabled) return
                if (active) onActivate()
                else onSelect(index)
              }}
              onBlur={() => setHoveredIndex(null)}
              onFocus={() => {
                if (!disabled) hoverSignal(index)
              }}
              onPointerEnter={() => {
                if (!disabled) hoverSignal(index)
              }}
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
