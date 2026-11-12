import { create } from 'zustand'

/** 시연 데이터(쇼핑 목록 예시 사진) · 시연 기능(역할 전환 · 시연 콘솔 · API 흐름) — FE 동작 설정 */
export type AppSettingValues = { isMockEnabled: boolean; isDemoRoleSwitchEnabled: boolean }

/** 관리자 설정에서 고른 시연 데이터 사용 여부. 이 브라우저에만 기억한다 */
const DEMO_DATA_KEY = 'kidly.demo-data'

/** 시연 데이터 사용 여부: 관리자가 고른 값('on' · 'off')이 있으면 그 값, 없으면 빌드 값(없으면 켬) */
export function resolveMockEnabled(buildValue: string | undefined, saved: string | null): boolean {
  if (saved === 'on') return true
  if (saved === 'off') return false
  return buildValue !== 'false'
}

function readSavedDemoData(): string | null {
  try {
    return localStorage.getItem(DEMO_DATA_KEY)
  } catch {
    return null
  }
}

/**
 * 실행 중 FE 동작 설정. 빌드 값(VITE_USE_MOCK · VITE_DEMO_ROLE_SWITCH, 없으면 켬)으로 시작하고,
 * 시연 데이터는 관리자 설정에서 고른 값이 있으면 그 값으로 시작한다.
 * 바꾸면(apply) 구독한 화면은 새로고침 없이 다시 그린다
 */
export const useAppSettings = create<AppSettingValues>()(() => ({
  isMockEnabled: resolveMockEnabled(import.meta.env.VITE_USE_MOCK, readSavedDemoData()),
  isDemoRoleSwitchEnabled: import.meta.env.VITE_DEMO_ROLE_SWITCH !== 'false',
}))

/** 화면 밖(요청 · 세션 복원)에서 읽고 바꿀 때 */
export const appSettings = {
  current: (): AppSettingValues => ({ ...useAppSettings.getState() }),
  apply: (next: AppSettingValues) => useAppSettings.setState({ ...next }),
  /** 관리자 설정: 시연 데이터를 켜고 끈다. 이 브라우저에 기억해 새로고침 뒤에도 유지한다 */
  setMockEnabled: (isMockEnabled: boolean) => {
    try {
      localStorage.setItem(DEMO_DATA_KEY, isMockEnabled ? 'on' : 'off')
    } catch {
      // 저장할 수 없으면 이번 탭에서만 적용
    }
    useAppSettings.setState({ isMockEnabled })
  },
}

/** 화면에서 시연 기능 여부를 읽는다. 바뀌면 다시 그린다 */
export const useDemoRoleSwitch = () => useAppSettings((state) => state.isDemoRoleSwitchEnabled)
