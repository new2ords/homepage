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
  })

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
    if (sample.muted) player.unMute?.()
    else player.mute?.()
    window.setTimeout(() => {
      setSample((current) => ({
        ...current,
        muted: player.isMuted?.() || false,
      }))
    }, 0)
  }

  const onScrub = (event) => {
    const nextTime = Number(event.target.value)
    playerRef.current?.seekTo?.(nextTime, true)
    setSample((current) => ({ ...current, time: nextTime }))
  }

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
      </div>
      <figcaption className="youtube-player-shell">
        <div className="youtube-player-meta">
          <span>{title || 'youtube'}</span>
          {caption ? <small>{caption}</small> : null}
        </div>
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
          <button type="button" onClick={toggleMute}>
            {sample.muted ? 'sound' : 'mute'}
          </button>
        </div>
        <p className="player-state" aria-live="polite">
          {playerState === 'buffering' ? 'buffering' : playerState}
        </p>
      </figcaption>
    </figure>
  )
}

