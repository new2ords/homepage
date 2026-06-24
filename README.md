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

Because deployment uses a custom GitHub Actions workflow, a committed `CNAME`
file is not required. Configure the domain in **Settings → Pages** and at the
domain's DNS provider.

Artist and release content lives in `src/data/artist.js`.

## Notes / writing

Add Markdown files to `src/content/notes/`:

```md
---
title: every word i owned
date: 2026-06-23
excerpt: every word i owned had already been spent
slug: every-word-i-owned
image: /notes/every-word-i-owned/cover.jpg
---

Your note here.
```

`npm run dev` generates the in-app notes reader. `npm run build` also generates
crawlable pages at `/notes/` and `/notes/<slug>/`, plus the sitemap and robots
file. Set `VITE_SITE_URL` as a GitHub Actions variable for canonical URLs.

## Google Analytics (GA4)

1. Create a free [Google Analytics](https://analytics.google.com/) account and add a **Web** data stream for your domain.
2. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
3. In GitHub, open **Settings → Secrets and variables → Actions** and add:
   - Name: `VITE_GA_MEASUREMENT_ID`
   - Value: your Measurement ID
4. Push to `main` — the deploy workflow injects it at build time.

Analytics is disabled during local `npm run dev`. To test locally, copy `.env.example` to `.env.local`, set your ID, and run `npm run build && npm run preview`.

Virtual page paths tracked in reports:

| View | Path |
|------|------|
| Home (artist) | `/` |
| Release | `/release` |
| Lyrics | `/lyrics` |
| Notes | `/notes` |
| Elsewhere | `/elsewhere` |

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

### Local timing tool

Run `npm run dev`, then open:

```text
http://localhost:5173/?timing
```

Choose a local audio file and press Space when each displayed word begins.
Undo with `Cmd+Z` or `Ctrl+Z`, then copy the generated timestamps into
`src/data/artist.js`.

The selected audio file stays in browser memory. It is not uploaded, copied
into the repository, or included in the production build. The timing tool is
available only while running Vite in development mode.

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

## Copyright

© 2026 new²ords. All rights reserved.
