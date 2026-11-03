import type { MemberRole, Role, SessionUser } from './session'

/** 메뉴 노출용. 권한 검증은 서버가 한다 */
export function hasRole(user: SessionUser | null, role: MemberRole): boolean {
  return user?.roles.includes(role) ?? false
}

/** 화면 노출용 역할: 회원 토큰의 역할 + 관리자 계정 로그인 (BE #755) */
export function viewerRoles(user: SessionUser | null, isAdminSignedIn: boolean): Role[] {
  const memberRoles = user?.roles ?? []
  return isAdminSignedIn ? [...memberRoles, 'ADMIN'] : memberRoles
}

export function describeUser(user: SessionUser): string {
  return `${user.nickname} · 회원 ${user.memberId} (${user.roles.join(' · ')})`
}

/** 백엔드 Member.NICKNAME_MIN_LENGTH · MAX_LENGTH (앞뒤 공백을 뺀 값으로 검사) */
export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 20

export function validateNickname(nickname: string): string | null {
  const value = nickname.trim()
  if (!value) return '닉네임을 입력해 주세요.'
  if (value.length < NICKNAME_MIN || value.length > NICKNAME_MAX)
    return `닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자예요.`
  return null
}
