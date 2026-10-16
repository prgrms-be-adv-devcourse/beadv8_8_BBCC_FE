import { create } from 'zustand'

export type Toast = {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
  /** 알림 안 이동 링크 (예: 장바구니로 가기) */
  action?: { label: string; href: string }
}

type ToastState = {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
}

let nextId = 1
const DURATION_MS = 3500

/** 짧은 결과 알림. Toaster가 그린다 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++
    // 최근 3개까지
    set({ toasts: [...get().toasts, { ...toast, id }].slice(-3) })
    setTimeout(() => get().dismiss(id), DURATION_MS)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}))

export function toast(message: string, options: Partial<Omit<Toast, 'id' | 'message'>> = {}) {
  useToastStore
    .getState()
    .push({ message, tone: options.tone ?? 'success', action: options.action })
}
