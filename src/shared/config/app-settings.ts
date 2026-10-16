/** 목 데이터 사용 (관리자 화면에서 바꾸는 FE 동작 설정) */
export type AppSettingValues = { isMockEnabled: boolean }

// 앱 시작 때 BE 설정(GET /settings)으로 덮어쓴다. 못 읽으면 빌드 값(없으면 켬)을 그대로 쓴다
let current: AppSettingValues = {
  isMockEnabled: import.meta.env.VITE_USE_MOCK !== 'false',
}

/**
 * 실행 중 FE 동작 설정. 목을 등록하기 전(main.tsx)에 한 번 적용한다.
 * 목은 앱이 시작할 때 등록하므로, 바꾼 값은 새로고침해야 적용된다
 */
export const appSettings = {
  current: (): AppSettingValues => ({ ...current }),
  apply: (next: AppSettingValues) => {
    current = { ...next }
  },
}
