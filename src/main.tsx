import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupMocks } from '@/app/mocks'
import { loadAppSettings } from '@/app/providers/load-app-settings'
import { setupAuth } from '@/app/providers/setup-auth'
import './index.css'

setupAuth()
// 첫 화면부터 BE 설정대로 그리도록 설정을 적용한 뒤에 화면 모듈을 불러온다
await loadAppSettings()
// 목 핸들러는 늘 등록하고, 목으로 응답할지는 요청할 때 설정(목 데이터)을 본다 (관리자가 바꾸면 바로 적용)
setupMocks()
const { App } = await import('@/app/App')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
