interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_TOSS_CLIENT_KEY?: string
  /** false면 목 응답을 끈다 (기본: 켬) */
  readonly VITE_USE_MOCK?: string
  /** false면 시연 역할 전환(개발용 토큰, local 프로필 전용)을 감춘다. 개발 토큰이 없는 서버 배포용 (기본: 켬) */
  readonly VITE_DEMO_ROLE_SWITCH?: string
  readonly VITE_KAKAO_CLIENT_ID?: string
  readonly VITE_KAKAO_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
