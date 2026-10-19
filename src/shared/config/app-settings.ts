import { create } from 'zustand'

/** 목 데이터 사용 · 시연 기능(역할 전환 · 시연 콘솔 · API 흐름) — 관리자 화면에서 바꾸는 FE 동작 설정 */
export type AppSettingValues = { isMockEnabled: boolean; isDemoRoleSwitchEnabled: boolean }

/**
 * 실행 중 FE 동작 설정. 앱 시작 때(main.tsx) BE 설정(GET /settings)으로 덮어쓰고, 못 읽으면 빌드 값(없으면 켬)을 쓴다.
 * 관리자 화면에서 바꾸면 바로 적용하고, 구독한 화면은 새로고침 없이 다시 그린다
 */
export const useAppSettings = create<AppSettingValues>()(() => ({
  isMockEnabled: import.meta.env.VITE_USE_MOCK !== 'false',
  isDemoRoleSwitchEnabled: import.meta.env.VITE_DEMO_ROLE_SWITCH !== 'false',
}))

/** 화면 밖(요청 · 세션 복원)에서 읽고 바꿀 때 */
export const appSettings = {
  current: (): AppSettingValues => ({ ...useAppSettings.getState() }),
  apply: (next: AppSettingValues) => useAppSettings.setState({ ...next }),
}

/** 화면에서 시연 기능 여부를 읽는다. 바뀌면 다시 그린다 */
export const useDemoRoleSwitch = () => useAppSettings((state) => state.isDemoRoleSwitchEnabled)
