export type MemberStatus = 'ACTIVE' | 'SUSPENDED'
/** ADMIN이면 관리자만, 나머지는 일반 회원 중에서 거른다 (BE #356) */
export type MemberFilter = 'ALL' | 'BUYER' | 'SELLER' | 'SUSPENDED' | 'ADMIN'

/** 관리자 회원 목록 한 줄 */
export type AdminMember = {
  id: string
  nickname: string
  email: string | null
  status: MemberStatus
  sellerStatus: 'ACTIVE' | 'SUSPENDED' | null
  suspendReason: string | null
  suspendedAt: string | null
  createdAt: string
  /** 응답에 역할이 없어서 관리자 탭(filter=ADMIN)에서 읽은 행인지로 정한다 */
  isAdmin: boolean
}

export const MEMBER_FILTER_LABEL: Record<MemberFilter, string> = {
  ALL: '전체',
  BUYER: '보호자',
  SELLER: '판매자',
  SUSPENDED: '정지',
  ADMIN: '관리자',
}

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: '활동 중',
  SUSPENDED: '이용 정지',
}
