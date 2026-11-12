import type { DevTokenRequestDto, MemberDto } from '../api/session.dto'
import {
  MEMBER_ROLES,
  type DemoAccount,
  type Member,
  type MemberRole,
  type SellerStatus,
  type SessionUser,
} from './session'

/** BE #762 배포 전에는 ADMIN이 올 수 있다. 모르는 역할은 버린다 */
function toMemberRoles(roles: string[]): MemberRole[] {
  return roles.filter((role): role is MemberRole => MEMBER_ROLES.includes(role as MemberRole))
}

export function toMember(dto: MemberDto): Member {
  return {
    id: String(dto.id),
    nickname: dto.nickname,
    email: dto.email ?? null,
    roles: toMemberRoles(dto.roles),
    sellerStatus: dto.sellerStatus as SellerStatus | null,
    providers: dto.providers,
  }
}

/** JWT payload를 읽는다. 서명 검증은 서버가 한다 */
function readClaims(accessToken: string): unknown {
  const payload = accessToken.split('.')[1] ?? ''
  const json = new TextDecoder().decode(
    Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), (char) =>
      char.charCodeAt(0),
    ),
  )
  return JSON.parse(json)
}

/** JWT payload(sub · nickname · roles)를 읽는다 */
export function toSessionUser(accessToken: string): SessionUser {
  const claims = readClaims(accessToken) as { sub: string; nickname?: string; roles?: string[] }
  return {
    memberId: claims.sub,
    nickname: claims.nickname ?? `회원${claims.sub}`,
    roles: toMemberRoles(claims.roles ?? []),
  }
}

export function toDevTokenRequest(account: DemoAccount): DevTokenRequestDto {
  return { memberId: Number(account.memberId), nickname: account.nickname, roles: account.roles }
}

/**
 * 관리자 토큰의 sub("admin:7", BE PrincipalId)에서 내 관리자 ID를 읽는다. 화면에서 자기 자신을 미리 막는 데만 쓴다.
 * 로그인 전 · 관리자 주체가 아님 · 읽을 수 없는 토큰이면 null (그때는 서버가 막는다)
 */
export function toAdminId(accessToken: string | null): string | null {
  if (!accessToken) return null
  try {
    const { sub } = readClaims(accessToken) as { sub?: unknown }
    return /^admin:(\d+)$/.exec(String(sub))?.[1] ?? null
  } catch {
    return null
  }
}
