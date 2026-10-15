export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  isDev: import.meta.env.DEV,
  /**
   * 시연 기능: 역할 전환(개발용 토큰) · 시연 콘솔 · API 흐름 · 시연 표시 · 시연용 문구.
   * 개발 토큰이 없는 서버면 false로 빌드 → 카카오 로그인만, 시연 기능은 모두 감춘다
   */
  demoRoleSwitch: import.meta.env.VITE_DEMO_ROLE_SWITCH !== 'false',
  tossClientKey: import.meta.env.VITE_TOSS_CLIENT_KEY ?? '',
  kakaoClientId: import.meta.env.VITE_KAKAO_CLIENT_ID ?? '',
  kakaoRedirectUri:
    import.meta.env.VITE_KAKAO_REDIRECT_URI || `${window.location.origin}/oauth/kakao/callback`,
}
