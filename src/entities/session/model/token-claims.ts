import type { Role } from './types'

/** Access Token(JWT)에 담긴 로그인 사용자. 화면 표시 · 메뉴 노출용 (검증은 서버) */
export type SessionUser = {
  memberId: number
  nickname: string
  roles: Role[]
}

export function readTokenClaims(accessToken: string): SessionUser {
  const payload = accessToken.split('.')[1] ?? ''
  const json = new TextDecoder().decode(
    Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), (char) =>
      char.charCodeAt(0),
    ),
  )
  const claims = JSON.parse(json) as { sub: string; nickname?: string; roles?: Role[] }
  return {
    memberId: Number(claims.sub),
    nickname: claims.nickname ?? `회원${claims.sub}`,
    roles: claims.roles ?? [],
  }
}
