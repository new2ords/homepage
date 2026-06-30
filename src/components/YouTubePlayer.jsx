import { useEffect, useRef, useState } from 'react'
import { getYouTubeEmbedUrl, loadYouTubeApi } from '../lib/youtube'

const SAMPLE_INTERVAL = 250

export default function YouTubePlayer({
  videoId,
  title,
  caption,
  visible = true,
  chromeless = false,
  onPlaybackSample,
}) {
  const iframeRef = useRef(null)
  const playerRef = useRef(null)
  const stateRef = useRef(-1)
  const visibleRef = useRef(visible)
  const sampleIntervalRef = useRef(null)
  const syncSamplingRef = useRef(() => {})
  const [playerState, setPlayerState] = useState('unstarted')
  const [sample, setSample] = useState({
    time: 0,
    duration: 0,
    playing: false,
    muted: false,
    volume: 100,
  })
  const [captionsEnabled, setCaptionsEnabled] = useState(false)
  const [captionsStatus, setCaptionsStatus] = useState('off')

  visibleRef.current = visible

  useEffect(() => {
    if (!videoId) return undefined
    let cancelled = false

    const publishSample = () => {
      const player = playerRef.current
      if (!player?.getCurrentTime) return

      const nextSample = {
        time: player.getCurrentTime(),
        duration: player.getDuration?.() || 0,
        sampledAt: performance.now(),
        playing: stateRef.current === window.YT.PlayerState.PLAYING,
        buffering: stateRef.current === window.YT.PlayerState.BUFFERING,
        muted: player.isMuted?.() || false,
        volume: player.getVolume?.() ?? 100,
      }
      setSample(nextSample)
      onPlaybackSample?.(nextSample)
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
        sampleIntervalRef.current = window.setInterval(
          publishSample,
          SAMPLE_INTERVAL,
        )
      }
    }

    syncSamplingRef.current = syncSampling

    loadYouTubeApi().then((YT) => {
      if (cancelled || !iframeRef.current) return

      playerRef.current = new YT.Player(iframeRef.current, {
        events: {
          onReady: () => {
            setPlayerState('ready')
            publishSample()
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
            publishSample()
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
  }, [onPlaybackSample, videoId])

  useEffect(() => {
    syncSamplingRef.current()
  }, [visible])

  if (!videoId) return null

  const togglePlayback = () => {
    const player = playerRef.current
    if (!player) return
    if (sample.playing) player.pauseVideo?.()
    else player.playVideo?.()
  }

  const toggleMute = () => {
    const player = playerRef.current
    if (!player) return
    const muted = player.isMuted?.() || false
    if (muted) player.unMute?.()
    else player.mute?.()
    window.setTimeout(() => {
      const nextMuted = player.isMuted?.() || false
      const nextVolume = player.getVolume?.() ?? sample.volume
      setSample((current) => ({
        ...current,
        muted: nextMuted,
        volume: nextVolume,
      }))
      onPlaybackSample?.({
        ...sample,
        muted: nextMuted,
        volume: nextVolume,
        sampledAt: performance.now(),
      })
    }, 80)
  }

  const onVolumeChange = (event) => {
    const nextVolume = Number(event.target.value)
    const player = playerRef.current
    if (!player) return
    player.setVolume?.(nextVolume)
    if (nextVolume <= 0) player.mute?.()
    else player.unMute?.()
    setSample((current) => ({
      ...current,
      muted: nextVolume <= 0,
      volume: nextVolume,
    }))
  }

  const toggleCaptions = () => {
    const player = playerRef.current
    if (!player) return
    const nextEnabled = !captionsEnabled
    if (nextEnabled) {
      setCaptionsStatus('checking')
      player.loadModule?.('captions')
      player.loadModule?.('cc')
      window.setTimeout(() => {
        const captionsTracks =
          player.getOption?.('captions', 'tracklist') ||
          player.getOption?.('cc', 'tracklist') ||
          []
        const hasCaptions = Array.isArray(captionsTracks)
          ? captionsTracks.length > 0
          : Boolean(captionsTracks)
        setCaptionsStatus(hasCaptions ? 'on' : 'unavailable')
      }, 420)
    } else {
      player.unloadModule?.('captions')
      player.unloadModule?.('cc')
      setCaptionsStatus('off')
    }
    setCaptionsEnabled(nextEnabled)
  }

  const onScrub = (event) => {
    const nextTime = Number(event.target.value)
    playerRef.current?.seekTo?.(nextTime, true)
    setSample((current) => ({ ...current, time: nextTime }))
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
  const currentTime = formatTime(sample.time)
  const duration = formatTime(sample.duration)

  return (
    <figure
      className={`youtube-player ${chromeless ? 'is-chromeless' : ''}`}
      aria-label={title || 'YouTube video'}
    >
      <div className="youtube-player-frame">
        <iframe
          ref={iframeRef}
          title={title || 'YouTube video'}
          src={getYouTubeEmbedUrl(videoId)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        <button
          className="youtube-player-hit-target"
          type="button"
          aria-label={sample.playing ? 'Pause video' : 'Play video'}
          onClick={togglePlayback}
        >
          <span aria-hidden="true">{sample.playing ? 'pause' : 'play'}</span>
        </button>
        <a
          className="youtube-player-open"
          href={youtubeUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open original video on YouTube"
        >
          <ExternalIcon />
        </a>
      </div>
      <figcaption className="youtube-player-shell">
        {!chromeless ? (
          <div className="youtube-player-meta">
            <span>{title || 'youtube'}</span>
            <a href={youtubeUrl} target="_blank" rel="noreferrer">
              youtube
            </a>
          </div>
        ) : null}
        <div className="youtube-player-controls" aria-label="YouTube controls">
          <button type="button" onClick={togglePlayback}>
            {sample.playing ? 'pause' : 'play'}
          </button>
          <input
            aria-label="Seek video"
            type="range"
            min="0"
            max={Math.max(sample.duration, 1)}
            step="0.1"
            value={Math.min(sample.time, Math.max(sample.duration, 1))}
            onChange={onScrub}
          />
          <span className="youtube-player-time" aria-label={`${currentTime} of ${duration}`}>
            {currentTime} / {duration}
          </span>
          <button
            className={`youtube-player-caption-button ${
              captionsEnabled ? 'is-active' : ''
            } is-${captionsStatus}`}
            type="button"
            aria-label={getCaptionsLabel(captionsStatus)}
            aria-pressed={captionsEnabled}
            onClick={toggleCaptions}
          >
            <span>cc</span>
          </button>
          <div className={`youtube-player-volume ${sample.muted ? 'is-muted' : 'has-sound'}`}>
            <button
              className="youtube-player-icon-button"
              type="button"
              aria-label={sample.muted ? 'Muted. Turn sound on' : 'Sound on. Mute video'}
              aria-pressed={sample.muted}
              onClick={toggleMute}
            >
              {sample.muted ? <MutedIcon /> : <SoundIcon />}
            </button>
            <div className="youtube-player-volume-panel">
              <input
                aria-label="Volume"
                type="range"
                min="0"
                max="100"
                step="1"
                value={sample.muted ? 0 : sample.volume}
                onChange={onVolumeChange}
              />
            </div>
          </div>
          <a
            className="youtube-player-control-link"
            href={youtubeUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open original video on YouTube"
          >
            <ExternalIcon />
          </a>
        </div>
        {caption && !chromeless ? (
          <p className="youtube-player-caption">{caption}</p>
        ) : null}
        <p className="player-state" aria-live="polite">
          {playerState === 'buffering' ? 'buffering' : playerState}
        </p>
      </figcaption>
    </figure>
  )
}

function SoundIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
      <path d="M16 9.5c1.1 1.3 1.1 3.7 0 5" />
      <path d="M18.5 7c2.1 2.5 2.1 7.5 0 10" />
    </svg>
  )
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
      <path d="m17 10 4 4" />
      <path d="m21 10-4 4" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 8h8v8" />
      <path d="m8 16 8-8" />
      <path d="M6 10v8h8" />
    </svg>
  )
}

function getCaptionsLabel(status) {
  if (status === 'checking') return 'Checking captions'
  if (status === 'on') return 'Captions on'
  if (status === 'unavailable') return 'No captions available'
  return 'Captions off'
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'

  const rounded = Math.floor(seconds)
  const minutes = Math.floor(rounded / 60)
  const remainingSeconds = String(rounded % 60).padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}
