import { useEffect, useRef, useState } from 'react'

const YOUTUBE_API_ID = 'youtube-iframe-api'
const SAMPLE_INTERVAL = 250

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)

  return new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.()
      resolve(window.YT)
    }

    if (!document.getElementById(YOUTUBE_API_ID)) {
      const script = document.createElement('script')
      script.id = YOUTUBE_API_ID
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)
    }
  })
}

export default function CassettePlayer({
  bandcampTrackId,
  bandcampUrl,
  videoId,
  visible,
  onPlaybackSample,
}) {
  const mountRef = useRef(null)
  const playerRef = useRef(null)
  const stateRef = useRef(-1)
  const visibleRef = useRef(visible)
  const sampleIntervalRef = useRef(null)
  const syncSamplingRef = useRef(() => {})
  const [playerState, setPlayerState] = useState('unstarted')

  const hasVideo = Boolean(videoId)
  const hasBandcamp = Boolean(bandcampTrackId)

  visibleRef.current = visible

  useEffect(() => {
    if (!hasVideo) return undefined
    let cancelled = false

    const sample = () => {
      const player = playerRef.current
      if (!player?.getCurrentTime) return

      const duration = player.getDuration?.() || 0
      onPlaybackSample({
        time: player.getCurrentTime(),
        duration,
        sampledAt: performance.now(),
        playing: stateRef.current === window.YT.PlayerState.PLAYING,
        buffering: stateRef.current === window.YT.PlayerState.BUFFERING,
      })
    }

    const stopSampling = () => {
      if (sampleIntervalRef.current) {
        window.clearInterval(sampleIntervalRef.current)
        sampleIntervalRef.current = null
      }
    }

    const syncSampling = () => {
      stopSampling()
      const playing = stateRef.current === window.YT?.PlayerState?.PLAYING
      if (visibleRef.current && playing) {
        sampleIntervalRef.current = window.setInterval(sample, SAMPLE_INTERVAL)
      }
    }

    syncSamplingRef.current = syncSampling

    loadYouTubeApi().then((YT) => {
      if (cancelled || !mountRef.current) return

      playerRef.current = new YT.Player(mountRef.current, {
        width: '356',
        height: '200',
        videoId,
        playerVars: {
          playsinline: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            setPlayerState('ready')
            sample()
            syncSampling()
          },
          onStateChange: (event) => {
            stateRef.current = event.data
            const labels = {
              [YT.PlayerState.ENDED]: 'ended',
              [YT.PlayerState.PLAYING]: 'playing',
              [YT.PlayerState.PAUSED]: 'paused',
              [YT.PlayerState.BUFFERING]: 'buffering',
              [YT.PlayerState.CUED]: 'cued',
            }
            setPlayerState(labels[event.data] || 'unstarted')
            sample()
            syncSampling()
          },
        },
      })
    })

    return () => {
      cancelled = true
      syncSamplingRef.current = () => {}
      stopSampling()
      playerRef.current?.destroy?.()
      playerRef.current = null
      stateRef.current = -1
    }
  }, [hasVideo, onPlaybackSample, videoId])

  useEffect(() => {
    syncSamplingRef.current()
  }, [visible])

  if (!hasVideo && !hasBandcamp) return null

  return (
    <div
      className={`player-area ${visible ? 'is-visible' : ''}`}
      aria-hidden={!visible}
      inert={!visible}
    >
      {hasVideo ? (
        <>
          <div className="youtube-frame" ref={mountRef} />
          <p className="player-state" aria-live="polite">
            {playerState === 'buffering' ? 'buffering' : playerState}
          </p>
        </>
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
