import { create } from 'zustand'
import { clearDemoAccount } from './demo-storage'
import type { Member, SessionUser } from './session'
import { toSessionUser } from './session.mapper'

type SessionStatus = 'restoring' | 'ready'

type SessionState = {
  /** 메모리에만 둔다. 새로고침하면 재발급으로 다시 받는다 */
  accessToken: string | null
  /** 토큰에서 읽은 사용자 */
  user: SessionUser | null
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
  setAccessToken: (accessToken) => set({ accessToken, user: toSessionUser(accessToken) }),
  setMember: (member) => set({ member }),
  setStatus: (status) => set({ status }),
  clear: () => {
    clearDemoAccount()
    set({ accessToken: null, user: null, member: null })
  },
}))
