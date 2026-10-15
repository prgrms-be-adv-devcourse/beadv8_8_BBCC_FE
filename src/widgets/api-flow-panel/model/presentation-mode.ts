import { create } from 'zustand'
import type { ApiCallLog } from '@/shared/api'

// 발표 모드: 흐름 패널을 넓히고 글씨를 키우며, 호출 목록에서 시연 잡음(역할 전환 · 예상된 응답 · 배경 조회)을 숨긴다
const STORAGE_KEY = 'kidly.presentation-mode'

function load(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

type PresentationModeState = { on: boolean; toggle: () => void }

export const usePresentationMode = create<PresentationModeState>()((set, get) => ({
  on: load(),
  toggle: () => {
    const on = !get().on
    try {
      localStorage.setItem(STORAGE_KEY, String(on))
    } catch {
      // 저장할 수 없으면 이 탭에서만 유지
    }
    set({ on })
  },
}))

const NOISE_PATHS = [/^\/dev\/tokens$/, /^\/auth\/reissue$/]

/** 발표 때 보여 줄 호출: 사용자 행동으로 일어난 호출(역할 전환 제외)과 실패. 예상된 응답 · 배경 조회는 숨긴다 */
export function isKeyCall(log: ApiCallLog): boolean {
  const path = log.path.split('?')[0]
  if (log.expectedReason) return false
  if (NOISE_PATHS.some((pattern) => pattern.test(path))) return false
  if (log.action?.startsWith('역할 전환')) return false
  const failed = log.status === null || log.status >= 400
  return failed || log.action !== null
}
