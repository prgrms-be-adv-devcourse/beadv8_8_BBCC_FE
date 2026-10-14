import type { AdminMember } from './member'

/** 이용 정지는 활동 중인 회원만 (이미 정지 · 탈퇴 · 관리자는 서버가 409) */
export function canSuspendMember(member: AdminMember): boolean {
  return member.status === 'ACTIVE'
}

/** 판매자 자격 정지는 판매 가능한 판매자만 */
export function canSuspendSeller(member: AdminMember): boolean {
  return member.sellerStatus === 'ACTIVE'
}
