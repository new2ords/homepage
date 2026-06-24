import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    document.documentElement.classList.add('app-ready')
    window.setTimeout(() => document.getElementById('boot-screen')?.remove(), 600)
  })
})
