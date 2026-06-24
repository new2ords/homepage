import { useEffect, useRef } from 'react'
import { artist } from '../data/artist'
import { getNote, notes } from '../lib/notes'
import { notePath } from '../lib/routing'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])'

function focusReadingLayer(layerElement) {
  const firstFocusable = layerElement.querySelector(FOCUSABLE_SELECTOR)
  ;(firstFocusable ?? layerElement).focus({ preventScroll: true })
}

export default function ReadingLayer({
  layer,
  noteSlug,
  onClose,
  onNavigate,
  onOpenNote,
  onBackToNotes,
}) {
  const notesLayerRef = useRef(null)
  const elsewhereLayerRef = useRef(null)

  useEffect(() => {
    if (layer === 'notes' && notesLayerRef.current) {
      notesLayerRef.current.scrollTop = 0
    }
    const activeLayer =
      layer === 'notes'
        ? notesLayerRef.current
        : layer === 'elsewhere'
          ? elsewhereLayerRef.current
          : null
    if (!activeLayer) return undefined

    const frame = window.requestAnimationFrame(() => {
      focusReadingLayer(activeLayer)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [layer, noteSlug])

  return (
    <div className="reading-stage">
      <section
        ref={notesLayerRef}
        className={`reading-layer reading-layer-notes ${
          layer === 'notes' ? 'is-active' : ''
        } ${layer === 'notes' && noteSlug ? 'is-reading-note' : ''}`}
        role={layer === 'notes' ? 'dialog' : undefined}
        aria-modal={layer === 'notes' ? 'true' : undefined}
        aria-hidden={layer !== 'notes'}
        aria-labelledby={noteSlug ? 'note-heading' : 'notes-heading'}
        inert={layer === 'notes' ? undefined : ''}
        tabIndex={layer === 'notes' ? undefined : -1}
      >
        <Notes
          noteSlug={noteSlug}
          onOpenNote={onOpenNote}
          onBackToNotes={onBackToNotes}
        />
      </section>

      <section
        ref={elsewhereLayerRef}
        className={`reading-layer reading-layer-elsewhere ${
          layer === 'elsewhere' ? 'is-active' : ''
        }`}
        role={layer === 'elsewhere' ? 'dialog' : undefined}
        aria-modal={layer === 'elsewhere' ? 'true' : undefined}
        aria-hidden={layer !== 'elsewhere'}
        aria-labelledby="elsewhere-heading"
        inert={layer === 'elsewhere' ? undefined : ''}
        tabIndex={layer === 'elsewhere' ? undefined : -1}
      >
        <Elsewhere />
      </section>

      <button
        className={`reading-desktop-return reading-desktop-return-${layer || 'hidden'}`}
        type="button"
        aria-label="Return to the main page"
        aria-hidden={!layer}
        inert={layer ? undefined : ''}
        tabIndex={layer ? undefined : -1}
        onClick={onClose}
      >
        <span className="reading-desktop-return-label">main</span>
      </button>

      <nav
        className={`reading-navigation ${layer ? 'is-visible' : ''}`}
        aria-label="Reading pages"
        aria-hidden={!layer}
        inert={layer ? undefined : ''}
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

function Notes({ noteSlug, onOpenNote, onBackToNotes }) {
  if (noteSlug) {
    return <NoteDetail note={getNote(noteSlug)} onBackToNotes={onBackToNotes} />
  }

  return (
    <div className="reading-page notes-page">
      <header className="reading-header">
        <p className="eyebrow">between the feels</p>
        <h2 id="notes-heading">notes</h2>
      </header>

      {notes.length ? (
        <ol className="notes-list">
          {notes.map((note, index) => (
            <li key={note.slug}>
              <article>
                <span className="note-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>
                    <button
                      className="note-open"
                      type="button"
                      onClick={() => onOpenNote(note.slug)}
                    >
                      {note.title}
                    </button>
                  </h3>
                  <p>{note.excerpt}</p>
                  <a className="note-permalink" href={notePath(note.slug)}>
                    permalink
                  </a>
                </div>
                <time className="note-date" dateTime={note.date}>
                  {formatNoteDate(note.date)}
                </time>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <div className="notes-coming-soon">
          <span>coming soon</span>
          <p>I’ll leave it here when it’s ready.</p>
        </div>
      )}
    </div>
  )
}

function NoteDetail({ note, onBackToNotes }) {
  if (!note) {
    return (
      <div className="reading-page notes-page">
        <header className="reading-header">
          <p className="eyebrow">between the feels</p>
          <h2 id="note-heading">notes</h2>
        </header>
        <div className="notes-coming-soon">
          <span>not found</span>
          <p>
            <button className="text-button" type="button" onClick={onBackToNotes}>
              back to notes
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="reading-page notes-page">
      <button className="note-back text-button" type="button" onClick={onBackToNotes}>
        ← notes
      </button>

      <article className="note-article">
        <header className="reading-header">
          <h2 id="note-heading">{note.title}</h2>
          {note.date ? (
            <p className="note-meta">
              <time dateTime={note.date}>{formatNoteDate(note.date)}</time>
            </p>
          ) : null}
        </header>

        {note.image ? <img className="note-hero" src={note.image} alt="" /> : null}

        <div
          className="note-body"
          dangerouslySetInnerHTML={{ __html: note.html }}
        />
      </article>
    </div>
  )
}

function formatNoteDate(value) {
  if (!value) return ''
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function Elsewhere() {
  return (
    <div className="reading-page elsewhere-page">
      <header className="reading-header">
        <p className="eyebrow">find me</p>
        <h2 id="elsewhere-heading">elsewhere</h2>
      </header>

      <div className="available-links">
        <a href={`mailto:${artist.links.email}`}>
          <span>
            <strong>write to me</strong>
            <small>{artist.links.email}</small>
          </span>
          <ExternalArrow />
        </a>
        <a href={artist.links.bandcampMeteor} target="_blank" rel="noreferrer">
          <span>
            <strong>listen to meteor</strong>
            <small>bandcamp</small>
          </span>
          <ExternalArrow />
        </a>
        {artist.links.spotifyMeteor ? (
          <a href={artist.links.spotifyMeteor} target="_blank" rel="noreferrer">
            <span>
              <strong>listen wherever you do</strong>
              <small>spotify</small>
            </span>
            <ExternalArrow />
          </a>
        ) : null}
        {artist.links.youtube ? (
          <a href={artist.links.youtube} target="_blank" rel="noreferrer">
            <span>
              <strong>from the room</strong>
              <small>youtube</small>
            </span>
            <ExternalArrow />
          </a>
        ) : null}
        <a href={artist.links.discord} target="_blank" rel="noreferrer">
          <span>
            <strong>join the book club</strong>
            <small>discord</small>
          </span>
          <ExternalArrow />
        </a>
        {artist.links.instagram ? (
          <a href={artist.links.instagram} target="_blank" rel="noreferrer">
            <span>
              <strong>along the way</strong>
              <small>instagram</small>
            </span>
            <ExternalArrow />
          </a>
        ) : (
          <div className="available-link available-link-soon">
            <span>
              <strong>along the way</strong>
              <small>soon</small>
            </span>
          </div>
        )}
        {!artist.links.spotifyMeteor ? (
          <div className="available-link available-link-soon">
            <span>
              <strong>listen wherever you do</strong>
              <small>soon</small>
            </span>
          </div>
        ) : null}
        {!artist.links.youtube ? (
          <div className="available-link available-link-soon">
            <span>
              <strong>from the room</strong>
              <small>soon</small>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ExternalArrow() {
  return (
    <svg
      className="external-arrow"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="M6 14 14 6M8 6h6v6" />
    </svg>
  )
}