import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { setupMocks } from '@/app/mocks'
import { setupAuth } from '@/app/providers/setup-auth'
import './index.css'

setupAuth()
if (import.meta.env.VITE_USE_MOCK !== 'false') {
  setupMocks()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
