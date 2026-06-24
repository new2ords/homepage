export default function ReleaseLinks({ bandcampUrl, spotifyUrl }) {
  const links = [
    {
      name: 'Bandcamp',
      url: bandcampUrl,
      icon: <BandcampIcon />,
    },
    {
      name: 'Spotify',
      url: spotifyUrl,
      icon: <SpotifyIcon />,
    },
  ].filter((link) => Boolean(link.url))

  if (links.length === 0) return null

  return (
    <nav className="release-links" aria-label="Listen to meteor">
      {links.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Listen to meteor on ${link.name}`}
          title={link.name}
        >
          {link.icon}
        </a>
      ))}
    </nav>
  )
}

function BandcampIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.2 7.5h12.3l-2.7 9H4.5l2.7-9Z" />
    </svg>
  )
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8.5c4.8-1.4 9.6-.9 14 1.3M6 12.2c4-1.1 8.1-.7 11.8 1.1M7 15.6c3.2-.8 6.4-.5 9.4.9" />
    </svg>
  )
}
