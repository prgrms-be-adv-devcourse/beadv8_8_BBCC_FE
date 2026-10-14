/** 로그인 · 재발급 · 개발용 토큰 응답 */
export type TokenResponseDto = { accessToken: string }

/** GET /members/me (백엔드 MemberResponse) */
export type MemberDto = {
  id: number
  nickname: string
  roles: string[]
  sellerStatus: string | null
  providers: string[]
}

/** POST /dev/tokens (local 프로필 전용) */
export type DevTokenRequestDto = { memberId: number; nickname?: string; roles: string[] }

/** PATCH /members/me (지금은 닉네임만, 앞뒤 공백은 서버도 뺀다) */
export type MemberUpdateRequestDto = { nickname: string }
