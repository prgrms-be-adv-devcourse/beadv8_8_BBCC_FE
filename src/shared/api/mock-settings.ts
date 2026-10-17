import { create } from 'zustand'

/**
 * 도메인별 목 사용 여부. 백엔드 API가 들어오면 흐름 패널에서 그 도메인만 끄고 바로 실제 서버로 확인한다.
 * 고른 값은 브라우저에 기억한다 (기본: 켬)
 */
const STORAGE_KEY = 'kidly.mock-settings'

function loadSaved(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

type MockSettingsState = {
  enabled: Record<string, boolean>
  register: (domain: string) => void
  toggle: (domain: string) => void
}

export const useMockSettings = create<MockSettingsState>()((set) => ({
  enabled: {},
  register: (domain) =>
    set((state) => ({ enabled: { ...state.enabled, [domain]: loadSaved()[domain] ?? true } })),
  toggle: (domain) =>
    set((state) => {
      const enabled = { ...state.enabled, [domain]: !state.enabled[domain] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled))
      } catch {
        // 저장할 수 없으면 이번 탭에서만 적용
      }
      return { enabled }
    }),
}))

/** 지금 목으로 응답할 도메인. 관리자 설정에서 목 데이터를 끄면 도메인 스위치와 상관없이 모두 끈다 */
export function activeMockDomains(
  enabled: Record<string, boolean>,
  isMockEnabled: boolean,
): Record<string, boolean> {
  return isMockEnabled ? enabled : {}
}
