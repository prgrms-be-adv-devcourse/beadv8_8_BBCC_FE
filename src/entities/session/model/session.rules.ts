import type { Role, SessionUser } from './session'

/** 메뉴 노출용. 권한 검증은 서버가 한다 */
export function hasRole(user: SessionUser | null, role: Role): boolean {
  return user?.roles.includes(role) ?? false
}

export function describeUser(user: SessionUser): string {
  return `${user.nickname} · 회원 ${user.memberId} (${user.roles.join(' · ')})`
}
