import { apiClient } from '@/shared/api'
import type { DevTokenRequestDto, MemberDto, TokenResponseDto } from './session.dto'

export const sessionApi = {
  /** 카카오 인가 코드로 로그인. 처음이면 가입된다. Refresh Token은 쿠키로 온다 */
  loginWithKakao: (code: string) =>
    apiClient
      .post<TokenResponseDto>('/auth/login/kakao', { code }, { skipAuth: true })
      .then((response) => response.data),
  issueDevToken: (request: DevTokenRequestDto) =>
    apiClient
      .post<TokenResponseDto>('/dev/tokens', request, { skipAuth: true })
      .then((response) => response.data),
  /** 쿠키가 없어도 204 */
  logout: () => apiClient.post<void>('/auth/logout', undefined, { skipAuth: true }),
  getMe: () => apiClient.get<MemberDto>('/members/me').then((response) => response.data),
}
