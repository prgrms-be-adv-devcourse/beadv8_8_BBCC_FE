import type { AdminMember } from './member'

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
