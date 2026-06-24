import { notes } from '../data/notes.generated.js'

export { notes }

export function getNote(slug) {
  return notes.find((note) => note.slug === slug) ?? null
}
