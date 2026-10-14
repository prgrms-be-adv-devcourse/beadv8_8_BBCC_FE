import { defineConfig, devices } from '@playwright/test'

// E2E: 가짜 백엔드 + Vite 개발 서버를 띄워 시연 흐름을 브라우저로 끝까지 따라간다.
// 로컬 개발 서버(5173) · 실제 백엔드(8080)와 겹치지 않는 포트를 쓴다
const FAKE_BACKEND_PORT = 18080
const APP_PORT = 5174

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // 모든 테스트가 가짜 백엔드 하나(메모리 상태)를 같이 쓴다.
  // 병렬로 돌면 서로의 데이터가 섞이고, 재시도는 앞 시도가 남긴 상태 때문에 통과할 수 없다
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // CI: 실패 메시지를 PR 주석(annotation)으로도 남긴다 (로그 · 리포트를 못 받는 환경에서도 원인 확인)
  reporter: process.env.CI ? [['list'], ['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // 브라우저를 따로 설치해 둔 환경이면 경로를 지정한다 (없으면 npx playwright install chromium으로 받은 것 사용)
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: [
    {
      command: `node e2e/fake-backend/server.mjs`,
      env: { PORT: String(FAKE_BACKEND_PORT) },
      port: FAKE_BACKEND_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx vite --port ${APP_PORT} --strictPort`,
      env: { VITE_API_BASE_URL: `http://localhost:${FAKE_BACKEND_PORT}`, VITE_USE_MOCK: 'true' },
      port: APP_PORT,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
