import { create } from 'zustand'

export type ConfirmOptions = {
  title: string
  description?: string
  /** 확인 버튼 문구 (기본 "확인") */
  confirmLabel?: string
  /** 되돌릴 수 없는 작업이면 빨간 버튼 */
  tone?: 'default' | 'danger'
}

type ConfirmState = {
  current: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  open: (options: ConfirmOptions) => Promise<boolean>
  close: (ok: boolean) => void
}

/** 화면 안 확인 모달 (window.confirm 대신). ConfirmHost가 그린다 */
export const useConfirmStore = create<ConfirmState>((set, get) => ({
  current: null,
  open: (options) =>
    new Promise<boolean>((resolve) => {
      get().current?.resolve(false)
      set({ current: { ...options, resolve } })
    }),
  close: (ok) => {
    get().current?.resolve(ok)
    set({ current: null })
  },
}))

/** 확인하면 true. 예: if (await confirmAction({ title: '구매확정할까요?' })) mutate() */
export const confirmAction = (options: ConfirmOptions) => useConfirmStore.getState().open(options)
