import type { DemoAccount } from './session'

// 개발용 토큰은 Refresh 쿠키가 없어 새로고침 · 토스 결제창 이동 뒤 세션이 사라진다.
// 시연 중에는 고른 계정을 탭에 기억해 두고 다시 발급받는다 (토큰 자체는 저장하지 않는다)
const KEY = 'kidly.demo-account'

export function saveDemoAccount(account: DemoAccount) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(account))
  } catch {
    // 저장소를 쓸 수 없으면 기억하지 않는다
  }
}

export function loadDemoAccount(): DemoAccount | null {
  try {
    const saved = sessionStorage.getItem(KEY)
    return saved ? (JSON.parse(saved) as DemoAccount) : null
  } catch {
    return null
  }
}

export function clearDemoAccount() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // 무시
  }
}
