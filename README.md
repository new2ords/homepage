# new²ords homepage

An interactive artist page built with Vite, React, Three.js, and GSAP.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` publishes `dist/` whenever
`main` is updated.

In the GitHub repository:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Add the custom domain under **Custom domain**.
4. Create `public/CNAME` containing only that domain before deploying.

Artist and release content lives in `src/data/artist.js`.

## YouTube and lyric synchronization

Set `youtubeVideoId` in `src/data/artist.js`, then replace each lyric's `null`
start time with its start time in seconds:

```js
['Meteor', 12.42],
['Fall', 12.91],
['through', 13.18],
```

The visible native YouTube player is the playback source. The lyric cloud reads
YouTube's current playback time, pauses during buffering, and recalculates after
seeks. Set `lyricOffsetMs` once during authoring if every timestamp feels
consistently early or late.

## Future content

The experience should continue the brand's language of books, poetry, memory,
and human experience rather than adding conventional product UI.

- Treat writing as **notes**, **pages**, or **marginalia**. Open it as a quiet
  reading layer that feels like entering another page of the work.
- Treat external platform links as a **colophon**: small, peripheral, and
  available without competing with the central artist → release → lyrics path.
- Let text, fragments, constellations, and negative space carry navigation.
  Avoid dashboard cards, icon grids, feeds, and generic social toolbars.
- Keep labels understandable. Poetic presentation should deepen the experience,
  not make basic navigation cryptic.

Store platform URLs in one data file. When the first written piece is ready,
add a `notes` layer opened with `#notes`, with entries stored as local Markdown.
This remains compatible with GitHub Pages and avoids introducing a router, CMS,
or backend. If search indexing becomes important later, migrate only the notes
to generated static pages.
