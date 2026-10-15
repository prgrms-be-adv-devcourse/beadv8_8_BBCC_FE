import { demoToolsOn, flagOn } from './flags'

const demoRoleSwitch = flagOn(import.meta.env.VITE_DEMO_ROLE_SWITCH)

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  isDev: import.meta.env.DEV,
  /** 시연 역할 전환(개발용 토큰). 개발 토큰이 없는 서버면 false로 빌드 → 카카오 로그인만 */
  demoRoleSwitch,
  /** 시연 도구(시연 막대 표시 · 시연 콘솔 · API 흐름 · 시연용 문구). 없으면 시연 역할 전환을 따른다 */
  demoTools: demoToolsOn(import.meta.env.VITE_DEMO_TOOLS, demoRoleSwitch),
  tossClientKey: import.meta.env.VITE_TOSS_CLIENT_KEY ?? '',
  kakaoClientId: import.meta.env.VITE_KAKAO_CLIENT_ID ?? '',
  kakaoRedirectUri:
    import.meta.env.VITE_KAKAO_REDIRECT_URI || `${window.location.origin}/oauth/kakao/callback`,
}
