import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupMocks } from '@/app/mocks'
import { setupAuth } from '@/app/providers/setup-auth'
import './index.css'

setupAuth()
// 목 핸들러는 늘 등록하고, 목으로 응답할지는 요청할 때 설정(목 데이터)을 본다
setupMocks()
const { App } = await import('@/app/App')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
