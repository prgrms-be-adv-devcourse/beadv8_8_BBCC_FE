import type { DevTokenRequestDto, MemberDto } from '../api/session.dto'
import type { DemoAccount, Member, Role, SellerStatus, SessionUser } from './session'

export function toMember(dto: MemberDto): Member {
  return {
    id: String(dto.id),
    nickname: dto.nickname,
    roles: dto.roles as Role[],
    sellerStatus: dto.sellerStatus as SellerStatus | null,
    providers: dto.providers,
  }
}

/** JWT payload(sub · nickname · roles)를 읽는다. 서명 검증은 서버가 한다 */
export function toSessionUser(accessToken: string): SessionUser {
  const payload = accessToken.split('.')[1] ?? ''
  const json = new TextDecoder().decode(
    Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), (char) =>
      char.charCodeAt(0),
    ),
  )
  const claims = JSON.parse(json) as { sub: string; nickname?: string; roles?: Role[] }
  return {
    memberId: claims.sub,
    nickname: claims.nickname ?? `회원${claims.sub}`,
    roles: claims.roles ?? [],
  }
}

export function toDevTokenRequest(account: DemoAccount): DevTokenRequestDto {
  return { memberId: Number(account.memberId), nickname: account.nickname, roles: account.roles }
}
