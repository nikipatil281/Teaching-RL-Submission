import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './presentation/theme/index.css'
import App from './App.jsx'
import { GameProvider } from './application/context/GameContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
)
