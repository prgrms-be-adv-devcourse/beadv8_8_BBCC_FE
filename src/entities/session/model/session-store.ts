import { create } from 'zustand'
import { clearDemoRequest } from './demo-storage'
import { readTokenClaims, type SessionUser } from './token-claims'
import type { Member, Role } from './types'

type SessionStatus = 'restoring' | 'ready'

type SessionState = {
  /** 메모리에만 둔다. 새로고침하면 재발급으로 다시 받는다 */
  accessToken: string | null
  /** 토큰에서 읽은 사용자 (항상 있음) */
  user: SessionUser | null
  /** GET /members/me 결과. 개발용 토큰은 회원이 없을 수 있어 null일 수 있다 */
  member: Member | null
  status: SessionStatus
  setAccessToken: (accessToken: string) => void
  setMember: (member: Member | null) => void
  setStatus: (status: SessionStatus) => void
  clear: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  accessToken: null,
  user: null,
  member: null,
  status: 'restoring',
  setAccessToken: (accessToken) => set({ accessToken, user: readTokenClaims(accessToken) }),
  setMember: (member) => set({ member }),
  setStatus: (status) => set({ status }),
  clear: () => {
    clearDemoRequest()
    set({ accessToken: null, user: null, member: null })
  },
}))

/** 메뉴 노출용. 권한 검증은 서버가 한다 */
export function hasRole(user: SessionUser | null, role: Role): boolean {
  return user?.roles.includes(role) ?? false
}
