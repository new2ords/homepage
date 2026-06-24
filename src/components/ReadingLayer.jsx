import {
  artist,
  forthcomingPlatforms,
} from '../data/artist'

export default function ReadingLayer({ layer, onClose, onNavigate }) {
  return (
    <div className="reading-stage">
      <section
        className={`reading-layer reading-layer-notes ${
          layer === 'notes' ? 'is-active' : ''
        }`}
        role={layer === 'notes' ? 'dialog' : undefined}
        aria-modal={layer === 'notes' ? 'true' : undefined}
        aria-hidden={layer !== 'notes'}
        aria-labelledby="notes-heading"
        inert={layer !== 'notes'}
      >
        <Notes />
      </section>

      <section
        className={`reading-layer reading-layer-elsewhere ${
          layer === 'elsewhere' ? 'is-active' : ''
        }`}
        role={layer === 'elsewhere' ? 'dialog' : undefined}
        aria-modal={layer === 'elsewhere' ? 'true' : undefined}
        aria-hidden={layer !== 'elsewhere'}
        aria-labelledby="elsewhere-heading"
        inert={layer !== 'elsewhere'}
      >
        <Elsewhere />
      </section>

      <button
        className={`reading-desktop-return reading-desktop-return-${layer || 'hidden'}`}
        type="button"
        aria-label="Return to the main page"
        aria-hidden={!layer}
        inert={!layer}
        onClick={onClose}
      >
        main
      </button>

      <nav
        className={`reading-navigation ${layer ? 'is-visible' : ''}`}
        aria-label="Reading pages"
        aria-hidden={!layer}
        inert={!layer}
      >
        <button
          type="button"
          aria-current={layer === 'notes' ? 'page' : undefined}
          disabled={layer === 'notes'}
          onClick={() => onNavigate('notes')}
        >
          <span aria-hidden="true">←</span> notes
        </button>
        <button type="button" onClick={onClose}>
          main
        </button>
        <button
          type="button"
          aria-current={layer === 'elsewhere' ? 'page' : undefined}
          disabled={layer === 'elsewhere'}
          onClick={() => onNavigate('elsewhere')}
        >
          elsewhere <span aria-hidden="true">→</span>
        </button>
      </nav>
    </div>
  )
}

function Notes() {
  return (
    <div className="reading-page notes-page">
      <header className="reading-header">
        <p className="eyebrow">between the feels</p>
        <h2 id="notes-heading">notes</h2>
      </header>

      <div className="notes-coming-soon">
        <span>coming soon</span>
        <p>I’ll leave it here when it’s ready.</p>
      </div>
    </div>
  )
}

function Elsewhere() {
  return (
    <div className="reading-page elsewhere-page">
      <header className="reading-header">
        <p className="eyebrow">find me</p>
        <h2 id="elsewhere-heading">elsewhere</h2>
      </header>

      <div className="available-links">
        <a href={artist.links.bandcampMeteor} target="_blank" rel="noreferrer">
          <span>
            <strong>new²ords music & merch</strong>
            <small>bandcamp</small>
          </span>
          <span aria-hidden="true">↗</span>
        </a>
        <a href={artist.links.discord} target="_blank" rel="noreferrer">
          <span>
            <strong>new²ords book club</strong>
            <small>discord</small>
          </span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="forthcoming-links">
        <ul>
          {forthcomingPlatforms.map((platform) => (
            <li key={platform.name}>
              <span>{platform.name}</span>
              <small>soon</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
