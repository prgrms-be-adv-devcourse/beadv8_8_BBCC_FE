/** JWT roles · 회원 응답의 역할 */
export type Role = 'BUYER' | 'SELLER' | 'ADMIN'

export type SellerStatus = 'ACTIVE' | 'SUSPENDED'

/** GET /members/me */
export type Member = {
  id: number
  nickname: string
  roles: Role[]
  /** 판매자가 아니면 null. 정지되면 SUSPENDED이고 roles에 SELLER가 없다 */
  sellerStatus: SellerStatus | null
  providers: string[]
}

/** 로그인 · 재발급 · 개발용 토큰 응답 */
export type TokenResponse = {
  accessToken: string
}

/** POST /dev/tokens (local 프로필 전용) */
export type DevTokenRequest = {
  memberId: number
  nickname?: string
  roles: Role[]
}
