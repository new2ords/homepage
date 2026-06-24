import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const root = createRoot(document.getElementById('root'))

if (import.meta.env.DEV && window.location.search === '?timing') {
  import('./tools/LyricTimingTool').then(({ default: LyricTimingTool }) => {
    root.render(
      <StrictMode>
        <LyricTimingTool />
      </StrictMode>,
    )
    revealApp()
  })
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  revealApp()
}

function revealApp() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.documentElement.classList.add('app-ready')
      window.setTimeout(
        () => document.getElementById('boot-screen')?.remove(),
        600,
      )
    })
  })
}
