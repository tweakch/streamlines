import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
/* Der Baukasten ist die Quelle für Tokens, Reset, Typografie und
   Bedienelemente — die App folgt ihm. Er kommt VOR index.css, damit das
   App-Blatt nachschärfen kann, was der Baukasten nicht kennt. */
import '../../prototype/kit/sot.css'
import '../../prototype/kit/sot-hex.css'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './shell/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
