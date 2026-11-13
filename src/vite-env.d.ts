interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_TOSS_CLIENT_KEY?: string
  /** false면 시연 데이터(쇼핑 목록 예시 사진)를 끈다 (기본: 켬) */
  readonly VITE_USE_MOCK?: string
  /** false면 시연 기능(역할 전환 · 시연 콘솔 · API 흐름 · 시연 표시 · 시연용 문구)을 감춘다. 개발 토큰이 없는 서버 배포용 (기본: 켬) */
  readonly VITE_DEMO_ROLE_SWITCH?: string
  readonly VITE_KAKAO_CLIENT_ID?: string
  readonly VITE_KAKAO_REDIRECT_URI?: string
  /** Firebase 웹 앱 설정 · VAPID 공개 키 (웹 푸시). 하나라도 없으면 웹 푸시를 끈다 */
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_FIREBASE_VAPID_KEY?: string
  /** Microsoft Clarity 프로젝트 ID. 운영(Vercel Production)에만 넣는다. 없으면 히트맵 · 녹화를 끈다 */
  readonly VITE_CLARITY_PROJECT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
