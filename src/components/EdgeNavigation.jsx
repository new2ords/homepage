export default function EdgeNavigation({ activeLayer, onOpen }) {
  const hidden = activeLayer !== null

  return (
    <nav
      className={`edge-navigation ${hidden ? 'is-hidden' : ''}`}
      aria-label="Writing and external links"
    >
      <button
        className="edge-link edge-link-notes"
        type="button"
        onClick={() => onOpen('notes')}
      >
        <span>notes</span>
        <small>between the feels</small>
      </button>
      <button
        className="edge-link edge-link-elsewhere"
        type="button"
        onClick={() => onOpen('elsewhere')}
      >
        <span>elsewhere</span>
        <small>find me</small>
      </button>
    </nav>
  )
}
