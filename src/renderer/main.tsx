import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './app/App'
import RuntimeGate from './app/RuntimeGate'
import Splash from './app/Splash'
import { applyTheme, initialTheme } from './app/theme'
import { registerWindowEvents } from './app/window-events'
import './styles.css'

registerWindowEvents()
// before the first paint, so the launch screen opens in the saved theme
applyTheme(initialTheme())
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <RuntimeGate>
        <App />
      </RuntimeGate>
    </HashRouter>
    <Splash />
  </StrictMode>,
)
