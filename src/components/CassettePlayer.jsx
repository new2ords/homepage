import YouTubePlayer from './YouTubePlayer'

export default function CassettePlayer({
  bandcampTrackId,
  bandcampUrl,
  videoId,
  title,
  visible,
  onPlaybackSample,
}) {
  const hasVideo = Boolean(videoId)
  const hasBandcamp = Boolean(bandcampTrackId)

  if (!hasVideo && !hasBandcamp) return null

  return (
    <div
      className={`player-area ${visible ? 'is-visible' : ''}`}
      aria-hidden={!visible}
      inert={!visible}
    >
      {hasVideo ? (
        <YouTubePlayer
          videoId={videoId}
          title={title}
          caption="youtube"
          visible={visible}
          onPlaybackSample={onPlaybackSample}
        />
      ) : (
        <div className="bandcamp-shell">
          <div className="bandcamp-meta">
            <span>bandcamp</span>
            <a href={bandcampUrl} target="_blank" rel="noreferrer">
              open the track
            </a>
          </div>
          <iframe
            className="bandcamp-frame"
            title="Listen to meteor on Bandcamp"
            src={`https://bandcamp.com/EmbeddedPlayer/track=${bandcampTrackId}/size=small/bgcol=070706/linkcol=91a9aa/transparent=true/`}
            seamless
          />
        </div>
      )}
    </div>
  )
}
