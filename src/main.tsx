import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { setupMocks } from '@/app/mocks'
import { loadAppSettings } from '@/app/providers/load-app-settings'
import { setupAuth } from '@/app/providers/setup-auth'
import { appSettings } from '@/shared/config'
import './index.css'

setupAuth()
// 목을 등록할지는 관리자 설정(BE)을 따른다. 설정을 못 읽으면 빌드 값을 쓴다
await loadAppSettings()
if (appSettings.current().isMockEnabled) {
  setupMocks()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
