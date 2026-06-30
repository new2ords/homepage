const YOUTUBE_API_ID = 'youtube-iframe-api'

export function loadYouTubeApi() {
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

export function getYouTubeEmbedUrl(videoId) {
  const params = new URLSearchParams({
    enablejsapi: '1',
    playsinline: '1',
    controls: '0',
    disablekb: '1',
    modestbranding: '1',
    rel: '0',
    origin: window.location.origin,
  })

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}
