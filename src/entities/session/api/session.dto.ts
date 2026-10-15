/** 로그인 · 재발급 · 개발용 토큰 응답 */
export type TokenResponseDto = { accessToken: string }

/** GET /members/me (백엔드 MemberResponse) */
export type MemberDto = {
  id: number
  nickname: string
  /** 가입 때 받은 카카오 이메일 (BE #242). 이메일을 받기 전에 가입했거나 개발용 토큰 회원은 null */
  email?: string | null
  roles: string[]
  sellerStatus: string | null
  providers: string[]
}

/** POST /dev/tokens (local 프로필 전용) */
export type DevTokenRequestDto = { memberId: number; nickname?: string; roles: string[] }

/** PATCH /members/me (지금은 닉네임만, 앞뒤 공백은 서버도 뺀다) */
export type MemberUpdateRequestDto = { nickname: string }
