import { MEMBER_FILTER_LABEL, type AdminMember, type MemberFilter } from './member'

/** 이용 정지는 활동 중인 일반 회원만 (이미 정지 · 탈퇴 · 관리자는 서버가 409) */
export function canSuspendMember(member: AdminMember): boolean {
  return member.status === 'ACTIVE' && !member.isAdmin
}

/** 관리자 지정은 활동 중인 일반 회원만 (정지 · 탈퇴 · 이미 관리자는 서버가 409) */
export function canGrantAdmin(member: AdminMember): boolean {
  return member.status === 'ACTIVE' && !member.isAdmin
}

/** 권한 해제는 관리자만. 본인은 해제할 수 없다 (관리자가 0명이 되지 않게, 서버도 409) */
export function canRevokeAdmin(member: AdminMember, myMemberId: string | undefined): boolean {
  return member.isAdmin && member.id !== myMemberId
}

/** 판매자 자격 정지는 판매 가능한 판매자만 */
export function canSuspendSeller(member: AdminMember): boolean {
  return member.sellerStatus === 'ACTIVE'
}

/** 주소의 ?filter= 값 → 거르기. 없거나 모르는 값은 전체 */
export function memberFilterOf(value: string | null): MemberFilter {
  return value !== null && value in MEMBER_FILTER_LABEL ? (value as MemberFilter) : 'ALL'
}

/**
 * 회원 하나 API가 없어 일반 목록 · 관리자 목록(filter=ADMIN)에서 번호로 찾는다.
 * 관리자 지정 뒤에는 일반 목록에서 빠지므로 관리자 목록을 먼저 본다
 */
export function findAdminMember(
  general: AdminMember[] | undefined,
  admins: AdminMember[] | undefined,
  memberId: string,
): AdminMember | undefined {
  const byId = (member: AdminMember) => member.id === memberId
  return admins?.find(byId) ?? general?.find(byId)
}
