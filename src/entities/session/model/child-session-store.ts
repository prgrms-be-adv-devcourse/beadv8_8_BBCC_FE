import { create } from 'zustand'

/** idle: 자녀 화면에 들어오기 전 (재발급을 아직 안 해 봄) */
type ChildSessionStatus = 'idle' | 'restoring' | 'ready'

type ChildSessionState = {
  accessToken: string | null
  status: ChildSessionStatus
  setAccessToken: (accessToken: string) => void
  setStatus: (status: ChildSessionStatus) => void
  clear: () => void
}

export const useChildSessionStore = create<ChildSessionState>()((set) => ({
  accessToken: null,
  status: 'idle',
  setAccessToken: (accessToken) => set({ accessToken }),
  setStatus: (status) => set({ status }),
  clear: () => set({ accessToken: null }),
}))
