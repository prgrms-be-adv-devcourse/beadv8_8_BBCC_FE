interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_TOSS_CLIENT_KEY?: string
  /** false면 목 응답을 끈다 (기본: 켬) */
  readonly VITE_USE_MOCK?: string
  /** false면 시연 역할 전환(개발용 토큰, local 프로필 전용)을 감춘다. 개발 토큰이 없는 서버 배포용 (기본: 켬) */
  readonly VITE_DEMO_ROLE_SWITCH?: string
  /** false면 시연 도구(시연 막대 표시 · 시연 콘솔 · API 흐름 · 시연용 문구)를 감춘다. 없으면 VITE_DEMO_ROLE_SWITCH를 따른다 */
  readonly VITE_DEMO_TOOLS?: string
  readonly VITE_KAKAO_CLIENT_ID?: string
  readonly VITE_KAKAO_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
