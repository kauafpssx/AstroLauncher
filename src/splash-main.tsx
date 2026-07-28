import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SplashScreen } from './components/splash/SplashScreen.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SplashScreen />
  </StrictMode>,
)
