import { create } from 'zustand'

type ChatbotOpenState = {
  /** 떠 있는 챗봇이 화면에 있는지 (화면 안 여는 버튼은 이때만 보인다) */
  isMounted: boolean
  isOpen: boolean
  setMounted: (isMounted: boolean) => void
  setOpen: (isOpen: boolean) => void
}

/** 챗봇 창 열림 상태: 떠 있는 버튼과 화면 안 버튼(상품 상세 휴대폰)이 같이 쓴다 */
export const useChatbotOpenStore = create<ChatbotOpenState>((set) => ({
  isMounted: false,
  isOpen: false,
  setMounted: (isMounted) => set({ isMounted }),
  setOpen: (isOpen) => set({ isOpen }),
}))
