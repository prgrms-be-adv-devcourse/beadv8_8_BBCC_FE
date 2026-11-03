import { MEMBER_FILTER_LABEL, type AdminMember, type MemberFilter } from './member'

/** 이용 정지는 활동 중인 회원만 (이미 정지 · 탈퇴는 서버가 409) */
export function canSuspendMember(member: AdminMember): boolean {
  return member.status === 'ACTIVE'
}

/** 판매자 자격 정지는 판매 가능한 판매자만 */
export function canSuspendSeller(member: AdminMember): boolean {
  return member.sellerStatus === 'ACTIVE'
}

/** 주소의 ?filter= 값 → 거르기. 없거나 모르는 값은 전체 */
export function memberFilterOf(value: string | null): MemberFilter {
  return value !== null && value in MEMBER_FILTER_LABEL ? (value as MemberFilter) : 'ALL'
}

/** 회원 하나 API가 없어 목록(keyword=회원 번호)에서 번호로 찾는다 */
export function findAdminMember(
  members: AdminMember[] | undefined,
  memberId: string,
): AdminMember | undefined {
  return members?.find((member) => member.id === memberId)
}
