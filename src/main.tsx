import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupMocks } from '@/app/mocks'
import { loadAppSettings } from '@/app/providers/load-app-settings'
import { setupAuth } from '@/app/providers/setup-auth'
import { appSettings } from '@/shared/config'
import './index.css'

setupAuth()
// 라우터 · 레이아웃이 시작할 때 시연 여부를 읽으므로, 설정을 적용한 뒤에 화면 모듈을 불러온다
await loadAppSettings()
if (appSettings.current().isMockEnabled) {
  setupMocks()
}
const { App } = await import('@/app/App')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
