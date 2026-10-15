export type MemberStatus = 'ACTIVE' | 'SUSPENDED'
export type MemberFilter = 'ALL' | 'BUYER' | 'SELLER' | 'SUSPENDED'

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
}

export const MEMBER_FILTER_LABEL: Record<MemberFilter, string> = {
  ALL: '전체',
  BUYER: '보호자',
  SELLER: '판매자',
  SUSPENDED: '정지',
}

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: '활동 중',
  SUSPENDED: '이용 정지',
}
