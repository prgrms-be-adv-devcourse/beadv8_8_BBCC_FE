import { create } from 'zustand'

/** 목 데이터 사용 · 시연 기능(역할 전환 · 시연 콘솔 · API 흐름) — FE 동작 설정 */
export type AppSettingValues = { isMockEnabled: boolean; isDemoRoleSwitchEnabled: boolean }

/** 관리자 설정에서 고른 값. 이 브라우저에만 기억한다 */
const SAVED_KEY = {
  isMockEnabled: 'kidly.demo-data',
  isDemoRoleSwitchEnabled: 'kidly.demo-features',
} as const satisfies Record<keyof AppSettingValues, string>

/** 관리자가 고른 값('on' · 'off')이 있으면 그 값, 없으면 빌드 값(없으면 켬) */
export function resolveSetting(buildValue: string | undefined, saved: string | null): boolean {
  if (saved === 'on') return true
  if (saved === 'off') return false
  return buildValue !== 'false'
}

function readSaved(key: keyof AppSettingValues): string | null {
  try {
    return localStorage.getItem(SAVED_KEY[key])
  } catch {
    return null
  }
}

/**
 * 실행 중 FE 동작 설정. 관리자 설정에서 고른 값이 있으면 그 값으로, 없으면 빌드 값
 * (VITE_USE_MOCK · VITE_DEMO_ROLE_SWITCH, 없으면 켬)으로 시작한다.
 * 바꾸면(apply · save) 구독한 화면은 새로고침 없이 다시 그린다
 */
export const useAppSettings = create<AppSettingValues>()(() => ({
  isMockEnabled: resolveSetting(import.meta.env.VITE_USE_MOCK, readSaved('isMockEnabled')),
  isDemoRoleSwitchEnabled: resolveSetting(
    import.meta.env.VITE_DEMO_ROLE_SWITCH,
    readSaved('isDemoRoleSwitchEnabled'),
  ),
}))

/** 화면 밖(요청 · 세션 복원)에서 읽고 바꿀 때 */
export const appSettings = {
  current: (): AppSettingValues => ({ ...useAppSettings.getState() }),
  apply: (next: AppSettingValues) => useAppSettings.setState({ ...next }),
  /** 관리자 설정: 시연 데이터 · 시연 기능을 켜고 끈다. 이 브라우저에 기억해 새로고침 뒤에도 유지한다 */
  save: (key: keyof AppSettingValues, enabled: boolean) => {
    try {
      localStorage.setItem(SAVED_KEY[key], enabled ? 'on' : 'off')
    } catch {
      // 저장할 수 없으면 이번 탭에서만 적용
    }
    useAppSettings.setState({ [key]: enabled })
  },
}

/** 화면에서 시연 기능 여부를 읽는다. 바뀌면 다시 그린다 */
export const useDemoRoleSwitch = () => useAppSettings((state) => state.isDemoRoleSwitchEnabled)
