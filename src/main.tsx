import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ModeratePage } from './components/ModeratePage.tsx'

// No router library -- this app only ever has two "pages", so a single
// pathname check here is simpler than adding a dependency for it.
const isModeratePage = window.location.pathname === '/moderate'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isModeratePage ? <ModeratePage /> : <App />}</StrictMode>,
)
