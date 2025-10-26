import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tailwind.css'
import 'leaflet/dist/leaflet.css'

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
