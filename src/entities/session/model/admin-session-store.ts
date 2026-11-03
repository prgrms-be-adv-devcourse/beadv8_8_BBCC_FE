import { create } from 'zustand'

/** idle: 관리자 화면에 들어오기 전 (재발급을 아직 안 해 봄) */
type AdminSessionStatus = 'idle' | 'restoring' | 'ready'

type AdminSessionState = {
  /**
   * 관리자 Access Token (BE #736). 회원 토큰과 따로 두어 같은 탭에서 회원 · 관리자 로그인이 서로 덮지 않는다.
   * 클레임은 sub("admin:7") · iat · exp뿐이라 읽지 않는다. 메모리에만 두고 새로고침하면 재발급으로 다시 받는다
   */
  accessToken: string | null
  status: AdminSessionStatus
  setAccessToken: (accessToken: string) => void
  setStatus: (status: AdminSessionStatus) => void
  clear: () => void
}

export const useAdminSessionStore = create<AdminSessionState>()((set) => ({
  accessToken: null,
  status: 'idle',
  setAccessToken: (accessToken) => set({ accessToken }),
  setStatus: (status) => set({ status }),
  clear: () => set({ accessToken: null }),
}))
