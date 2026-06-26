import { notesListUrl } from '../lib/routing'

export default function EdgeNavigation({ visible, activeLayer, onOpen }) {
  const hidden = !visible || activeLayer !== null
  const openLayer = (event, layer) => {
    event.preventDefault()
    onOpen(layer)
  }

  return (
    <nav
      className={`edge-navigation ${hidden ? 'is-hidden' : ''}`}
      aria-label="Writing and external links"
      aria-hidden={hidden}
      inert={hidden}
    >
      <a
        className="edge-link edge-link-notes"
        href={notesListUrl()}
        tabIndex={hidden ? -1 : undefined}
        onClick={(event) => openLayer(event, 'notes')}
      >
        <span>notes</span>
        <small>between the feels</small>
      </a>
      <a
        className="edge-link edge-link-elsewhere"
        href="/elsewhere/"
        tabIndex={hidden ? -1 : undefined}
        onClick={(event) => openLayer(event, 'elsewhere')}
      >
        <span>find me</span>
        <small>elsewhere</small>
      </a>
    </nav>
  )
}
