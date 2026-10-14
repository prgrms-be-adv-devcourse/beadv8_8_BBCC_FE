interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_TOSS_CLIENT_KEY?: string
  /** false면 목 응답을 끈다 (기본: 켬) */
  readonly VITE_USE_MOCK?: string
  readonly VITE_KAKAO_CLIENT_ID?: string
  readonly VITE_KAKAO_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
