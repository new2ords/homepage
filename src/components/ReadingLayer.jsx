import { useEffect, useRef } from 'react'
import { artist } from '../data/artist'
import { getNote, notes } from '../lib/notes'
import { notePath } from '../lib/routing'

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
      activeLayer.focus({ preventScroll: true })
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
        inert={layer !== 'notes'}
        tabIndex={-1}
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
        inert={layer !== 'elsewhere'}
        tabIndex={-1}
      >
        <Elsewhere />
      </section>

      <button
        className={`reading-desktop-return reading-desktop-return-${layer || 'hidden'}`}
        type="button"
        aria-label="Return to the main page"
        aria-hidden={!layer}
        inert={!layer}
        tabIndex={layer ? undefined : -1}
        onClick={onClose}
      >
        <span className="reading-desktop-return-label">main</span>
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
  const listeningPlatforms = [
    { name: 'bandcamp', url: artist.links.bandcampMeteor },
    { name: 'spotify', url: artist.links.spotifyMeteor },
    { name: 'apple music', url: '' },
    { name: 'youtube music', url: '' },
  ]

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
        <div className="available-link listening-link">
          <span>
            <strong>listen to meteor</strong>
            <small>meteor</small>
          </span>
          <div className="listening-platforms" aria-label="Streaming platforms">
            {listeningPlatforms.map((platform) =>
              platform.url ? (
                <a
                  key={platform.name}
                  className="listening-platform is-available"
                  href={platform.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Listen on ${platform.name}`}
                >
                  {platform.name}
                  <ExternalArrow />
                </a>
              ) : (
                <span
                  key={platform.name}
                  className="listening-platform is-pending"
                  title="Coming soon"
                >
                  {platform.name}
                  <i aria-hidden="true" />
                </span>
              ),
            )}
          </div>
        </div>
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
        {artist.links.youtube ? (
          <a href={artist.links.youtube} target="_blank" rel="noreferrer">
            <span>
              <strong>from the room</strong>
              <small>youtube</small>
            </span>
            <ExternalArrow />
          </a>
        ) : (
          <div className="available-link available-link-soon">
            <span>
              <strong>from the room</strong>
              <small>soon</small>
            </span>
          </div>
        )}
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
