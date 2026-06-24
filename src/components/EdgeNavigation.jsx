export default function EdgeNavigation({ visible, activeLayer, onOpen }) {
  const hidden = !visible || activeLayer !== null

  return (
    <nav
      className={`edge-navigation ${hidden ? 'is-hidden' : ''}`}
      aria-label="Writing and external links"
      aria-hidden={hidden}
      inert={hidden ? '' : undefined}
    >
      <button
        className="edge-link edge-link-notes"
        type="button"
        tabIndex={hidden ? -1 : undefined}
        onClick={() => onOpen('notes')}
      >
        <span>notes</span>
        <small>between the feels</small>
      </button>
      <button
        className="edge-link edge-link-elsewhere"
        type="button"
        tabIndex={hidden ? -1 : undefined}
        onClick={() => onOpen('elsewhere')}
      >
        <span>find me</span>
        <small>elsewhere</small>
      </button>
    </nav>
  )
}
