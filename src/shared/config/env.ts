import { appSettings } from './app-settings'

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  isDev: import.meta.env.DEV,
  /**
   * 시연 기능: 역할 전환(개발용 토큰) · 시연 콘솔 · API 흐름 · 시연 표시 · 시연용 문구.
   * 끄면 카카오 로그인만, 시연 기능은 모두 감춘다. 관리자 화면 설정을 따른다 (appSettings)
   */
  get demoRoleSwitch() {
    return appSettings.current().isDemoRoleSwitchEnabled
  },
  tossClientKey: import.meta.env.VITE_TOSS_CLIENT_KEY ?? '',
  kakaoClientId: import.meta.env.VITE_KAKAO_CLIENT_ID ?? '',
  kakaoRedirectUri:
    import.meta.env.VITE_KAKAO_REDIRECT_URI || `${window.location.origin}/oauth/kakao/callback`,
}
