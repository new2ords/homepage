import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { marked } from 'marked'
import { artist } from '../src/data/artist.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const contentDir = path.join(root, 'src/content/notes')
const publicNotesDir = path.join(root, 'public/notes')
const publicElsewhereDir = path.join(root, 'public/elsewhere')
const generatedFile = path.join(root, 'src/data/notes.generated.js')

const siteUrl = (process.env.VITE_SITE_URL || 'https://new2ords.com').replace(/\/$/, '')
const siteName = 'new²ords'

marked.setOptions({ gfm: true, breaks: false })

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function toAbsoluteUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//.test(value)) return value
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`
}

function normalizeDate(value) {
  if (!value) return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const text = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  return text
}

function loadNotes() {
  if (!fs.existsSync(contentDir)) {
    return []
  }

  return fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = fs.readFileSync(path.join(contentDir, file), 'utf8')
      const { data, content } = matter(source)
      const slug = data.slug || file.replace(/\.md$/, '')
      const title = data.title || slug
      const dateMatch = source.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m)
      const date = dateMatch?.[1] || normalizeDate(data.date)
      const excerpt = data.excerpt || ''
      const image = data.image ? toAbsoluteUrl(data.image) : ''

      return {
        slug,
        title,
        date,
        excerpt,
        image,
        html: marked.parse(content),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

function pageStyles() {
  return `
    :root { color: #f3f4f6; background: #020408; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100%;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
    }
    a { color: rgba(243, 244, 246, 0.72); }
    a:hover { color: #93c5fd; }
    .reading-page {
      width: min(760px, calc(100% - 48px));
      margin: 0 auto;
      padding: clamp(100px, 15vh, 150px) 0 140px;
    }
    .reading-header { max-width: 560px; margin-bottom: 48px; }
    .eyebrow {
      margin: 0 0 16px;
      color: rgba(243, 244, 246, 0.68);
      font-size: 1.05rem;
      font-style: italic;
    }
    .reading-header h1 {
      margin: 0 0 20px;
      font-size: clamp(3.2rem, 10vw, 5.5rem);
      font-style: italic;
      font-weight: 300;
      letter-spacing: -0.045em;
      line-height: 0.95;
    }
    .note-meta {
      margin: 0;
      color: rgba(243, 244, 246, 0.5);
      font-size: 0.95rem;
      font-style: italic;
    }
    .site-nav {
      margin-bottom: 56px;
      font-size: 0.95rem;
      font-style: italic;
    }
    .site-nav a + a { margin-left: 18px; }
    .notes-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .notes-list li {
      padding: 24px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.07);
    }
    .notes-list li:last-child { border-bottom: 1px solid rgba(255, 255, 255, 0.07); }
    .notes-list h2 {
      margin: 0 0 6px;
      font-size: clamp(1.35rem, 3vw, 1.8rem);
      font-style: italic;
      font-weight: 300;
    }
    .notes-list p {
      margin: 0;
      color: rgba(243, 244, 246, 0.5);
      font-size: 0.95rem;
      font-style: italic;
    }
    .note-hero {
      display: block;
      width: 100%;
      margin: 0 0 36px;
      border-radius: 2px;
    }
    .note-body {
      color: rgba(243, 244, 246, 0.78);
      font-size: clamp(1.05rem, 2vw, 1.25rem);
      font-style: italic;
      line-height: 1.75;
    }
    .note-body h2 {
      margin: 2.2em 0 0.6em;
      font-size: clamp(1.35rem, 3vw, 1.75rem);
      font-style: italic;
      font-weight: 300;
    }
    .note-body p { margin: 0 0 1.2em; }
    .note-body img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 1.8em auto;
    }
    .note-body blockquote {
      margin: 1.8em 0;
      padding-left: 18px;
      border-left: 1px solid rgba(255, 255, 255, 0.14);
      color: rgba(243, 244, 246, 0.62);
    }
  `
}

function headMeta({ title, description, canonical, image, type = 'article', jsonLd }) {
  const absoluteImage = image ? toAbsoluteUrl(image) : ''
  return `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    ${
      absoluteImage
        ? `<meta property="og:image" content="${escapeHtml(absoluteImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${escapeHtml(absoluteImage)}" />`
        : `<meta name="twitter:card" content="summary" />`
    }
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap"
      rel="stylesheet"
    />
    <style>${pageStyles()}</style>
  `
}

function renderIndexPage(notes) {
  const canonical = `${siteUrl}/notes/`
  const listItems = notes
    .map(
      (note) => `
        <li>
          <article>
            <h2><a href="/notes/${escapeHtml(note.slug)}/">${escapeHtml(note.title)}</a></h2>
            <p>${escapeHtml(note.excerpt)}</p>
          </article>
        </li>
      `,
    )
    .join('')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${siteName} — notes`,
    description: 'Writing between the feels from new²ords.',
    url: canonical,
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: siteUrl,
    },
  }

  return `<!doctype html>
<html lang="en">
  <head>${headMeta({
    title: `${siteName} — notes`,
    description: 'Writing between the feels from new²ords.',
    canonical,
    type: 'website',
    jsonLd,
  })}</head>
  <body>
    <main class="reading-page">
      <nav class="site-nav" aria-label="Site">
        <a href="/">home</a>
        <a href="/notes/">notes</a>
      </nav>
      <header class="reading-header">
        <p class="eyebrow">between the feels</p>
        <h1>notes</h1>
      </header>
      <ol class="notes-list">
        ${listItems}
      </ol>
    </main>
  </body>
</html>`
}

function renderNotePage(note) {
  const canonical = `${siteUrl}/notes/${note.slug}/`
  const title = `${note.title} — ${siteName}`
  const hero = note.image
    ? `<img class="note-hero" src="${escapeHtml(note.image)}" alt="" />`
    : ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: note.title,
    description: note.excerpt,
    datePublished: note.date,
    dateModified: note.date,
    author: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
    },
    mainEntityOfPage: canonical,
    url: canonical,
    ...(note.image ? { image: [toAbsoluteUrl(note.image)] } : {}),
  }

  return `<!doctype html>
<html lang="en">
  <head>${headMeta({
    title,
    description: note.excerpt,
    canonical,
    image: note.image,
    jsonLd,
  })}</head>
  <body>
    <main class="reading-page">
      <nav class="site-nav" aria-label="Site">
        <a href="/">home</a>
        <a href="/notes/">notes</a>
      </nav>
      <article itemscope itemtype="https://schema.org/BlogPosting">
        <header class="reading-header">
          <h1 itemprop="headline">${escapeHtml(note.title)}</h1>
          ${
            note.date
              ? `<p class="note-meta"><time itemprop="datePublished" datetime="${escapeHtml(note.date)}">${escapeHtml(note.date)}</time></p>`
              : ''
          }
        </header>
        ${hero}
        <div class="note-body" itemprop="articleBody">
          ${note.html}
        </div>
      </article>
    </main>
  </body>
</html>`
}

function renderElsewherePage() {
  const canonical = `${siteUrl}/elsewhere/`
  const platformLinks = [
    { name: 'bandcamp', url: artist.links.bandcampMeteor },
    { name: 'spotify', url: artist.links.spotifyMeteor },
    { name: 'instagram', url: artist.links.instagram },
    { name: 'youtube', url: artist.links.youtube },
    { name: 'discord', url: artist.links.discord },
  ]
    .filter((link) => link.url)
    .map(
      (link) => `
        <li>
          <a href="${escapeHtml(link.url)}" rel="me noreferrer">${escapeHtml(link.name)}</a>
        </li>
      `,
    )
    .join('')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${siteName} — elsewhere`,
    description: `Official links for ${siteName}.`,
    url: canonical,
    mainEntity: {
      '@type': 'MusicGroup',
      name: siteName,
      url: siteUrl,
      email: artist.links.email,
      sameAs: [
        artist.links.bandcampMeteor,
        artist.links.instagram,
        artist.links.youtube,
        artist.links.discord,
        artist.links.spotifyMeteor,
      ].filter(Boolean),
    },
  }

  return `<!doctype html>
<html lang="en">
  <head>${headMeta({
    title: `${siteName} — elsewhere`,
    description: `Official links for ${siteName}.`,
    canonical,
    type: 'profile',
    jsonLd,
  })}</head>
  <body>
    <main class="reading-page">
      <nav class="site-nav" aria-label="Site">
        <a href="/">home</a>
        <a href="/notes/">notes</a>
        <a href="/elsewhere/">elsewhere</a>
      </nav>
      <header class="reading-header">
        <p class="eyebrow">find me</p>
        <h1>elsewhere</h1>
      </header>
      <ul class="notes-list">
        ${
          artist.links.email
            ? `<li><h2><a href="mailto:${escapeHtml(artist.links.email)}">write to me</a></h2><p>${escapeHtml(artist.links.email)}</p></li>`
            : ''
        }
        ${platformLinks}
      </ul>
    </main>
  </body>
</html>`
}

function writeGeneratedModule(notes) {
  const payload = notes.map(({ slug, title, date, excerpt, image, html }) => ({
    slug,
    title,
    date,
    excerpt,
    image,
    html,
  }))

  fs.writeFileSync(
    generatedFile,
    `// Generated by scripts/build-notes.mjs — do not edit.\nexport const notes = ${JSON.stringify(payload, null, 2)}\n`,
  )
}

function writeStaticPages(notes) {
  fs.rmSync(publicNotesDir, { recursive: true, force: true })
  fs.rmSync(publicElsewhereDir, { recursive: true, force: true })
  fs.mkdirSync(publicNotesDir, { recursive: true })
  fs.mkdirSync(publicElsewhereDir, { recursive: true })

  fs.writeFileSync(path.join(publicNotesDir, 'index.html'), renderIndexPage(notes))
  fs.writeFileSync(
    path.join(publicElsewhereDir, 'index.html'),
    renderElsewherePage(),
  )

  for (const note of notes) {
    const noteDir = path.join(publicNotesDir, note.slug)
    fs.mkdirSync(noteDir, { recursive: true })
    fs.writeFileSync(path.join(noteDir, 'index.html'), renderNotePage(note))
  }
}

function writeSitemap(notes) {
  const urls = [
    `${siteUrl}/`,
    `${siteUrl}/notes/`,
    `${siteUrl}/elsewhere/`,
    ...notes.map((note) => `${siteUrl}/notes/${note.slug}/`),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeHtml(url)}</loc>
  </url>`,
  )
  .join('\n')}
</urlset>
`

  fs.writeFileSync(path.join(root, 'public/sitemap.xml'), body)
}

function writeRobots() {
  fs.writeFileSync(
    path.join(root, 'public/robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  )
}

const notes = loadNotes()
writeGeneratedModule(notes)

if (process.argv.includes('--static')) {
  writeStaticPages(notes)
  writeSitemap(notes)
  writeRobots()
  console.log(`Built ${notes.length} note(s) with static pages for ${siteUrl}`)
} else {
  console.log(`Built ${notes.length} note(s) for app data`)
}
