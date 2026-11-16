import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupAuth } from '@/app/providers/setup-auth'
import './index.css'

setupAuth()
const { App } = await import('@/app/App')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
