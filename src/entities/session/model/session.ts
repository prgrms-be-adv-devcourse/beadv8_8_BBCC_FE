/** JWT roles · 회원 응답의 역할 */
export type Role = 'BUYER' | 'SELLER' | 'ADMIN'
export type SellerStatus = 'ACTIVE' | 'SUSPENDED'

/** Access Token(JWT)에 담긴 로그인 사용자. 화면 표시 · 메뉴 노출용 (검증은 서버) */
export type SessionUser = {
  memberId: string
  nickname: string
  roles: Role[]
}

/** 내 정보 (GET /members/me). 개발용 토큰은 회원 행이 없을 수 있어 없을 수도 있다 */
export type Member = {
  id: string
  nickname: string
  /** 카카오 이메일. 없으면 null */
  email: string | null
  roles: Role[]
  /** 판매자가 아니면 null. 정지되면 SUSPENDED이고 roles에 SELLER가 없다 */
  sellerStatus: SellerStatus | null
  providers: string[]
}

/** 시연용 계정 (개발용 토큰으로 로그인) */
export type DemoAccount = {
  label: string
  memberId: string
  nickname: string
  roles: Role[]
}

export const ROLE_LABEL: Record<Role, string> = {
  BUYER: '보호자',
  SELLER: '판매자',
  ADMIN: '관리자',
}
