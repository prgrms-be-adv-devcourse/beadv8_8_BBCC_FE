import { apiClient, expectShape } from '@/shared/api'
import type { DevTokenRequestDto, MemberDto, TokenResponseDto } from './session.dto'
import { memberShape, tokenShape } from './session.shape'

export const sessionApi = {
  /** 카카오 인가 코드로 로그인. 처음이면 가입된다. Refresh Token은 쿠키로 온다 */
  loginWithKakao: (code: string) =>
    apiClient
      .post<TokenResponseDto>('/auth/login/kakao', { code }, { skipAuth: true })
      .then(expectShape(tokenShape)),
  issueDevToken: (request: DevTokenRequestDto) =>
    apiClient
      .post<TokenResponseDto>('/dev/tokens', request, { skipAuth: true })
      .then(expectShape(tokenShape)),
  /** 쿠키가 없어도 204 */
  logout: () => apiClient.post<void>('/auth/logout', undefined, { skipAuth: true }),
  getMe: () => apiClient.get<MemberDto>('/members/me').then(expectShape(memberShape)),
}
