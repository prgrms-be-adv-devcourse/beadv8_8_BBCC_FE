import { appSettings } from './app-settings'

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  isDev: import.meta.env.DEV,
  /**
   * 시연 기능: 역할 전환(개발용 토큰) · 시연 콘솔 · API 흐름 · 시연 표시 · 시연용 문구.
   * 끄면 카카오 로그인만, 시연 기능은 모두 감춘다. 빌드 값 VITE_DEMO_ROLE_SWITCH를 따른다 (appSettings).
   * 화면(컴포넌트)에서는 바뀌면 다시 그리도록 useDemoRoleSwitch()를 쓴다
   */
  get demoRoleSwitch() {
    return appSettings.current().isDemoRoleSwitchEnabled
  },
  portoneStoreId: import.meta.env.VITE_PORTONE_STORE_ID ?? '',
  portoneChannelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY ?? '',
  tossClientKey: import.meta.env.VITE_TOSS_CLIENT_KEY ?? '',
  /** Clarity 프로젝트 ID. 비어 있으면 행동 분석 스크립트를 넣지 않는다 (운영 배포에만 넣는다) */
  clarityProjectId: import.meta.env.VITE_CLARITY_PROJECT_ID ?? '',
  kakaoClientId: import.meta.env.VITE_KAKAO_CLIENT_ID ?? '',
  kakaoRedirectUri:
    import.meta.env.VITE_KAKAO_REDIRECT_URI || `${window.location.origin}/oauth/kakao/callback`,
}
