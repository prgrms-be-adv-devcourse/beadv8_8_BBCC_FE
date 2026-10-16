import { create } from 'zustand'

/** 흐름 패널 폭: 보통(오른쪽) · 넓게(화면 절반) · 전체(API만) */
export type PanelSize = 'normal' | 'wide' | 'full'

const STORAGE_KEY = 'kidly.flow-panel-size'

function load(): PanelSize {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'wide' || value === 'full' ? value : 'normal'
  } catch {
    return 'normal'
  }
}

type PanelSizeState = {
  size: PanelSize
  /** 상세를 보려고 잠깐 넓혔으면 원래 폭 (닫을 때 돌아간다) */
  restoreTo: PanelSize | null
  setSize: (size: PanelSize) => void
  /** 보통 폭이면 잠깐 넓게 (저장하지 않음) */
  widenForDetail: () => void
  /** 잠깐 넓혔으면 원래 폭으로 */
  restoreAfterDetail: () => void
}

export const usePanelSize = create<PanelSizeState>()((set, get) => ({
  size: load(),
  restoreTo: null,
  setSize: (size) => {
    try {
      localStorage.setItem(STORAGE_KEY, size)
    } catch {
      // 이 탭에서만 유지
    }
    // 직접 고른 폭은 그대로 둔다
    set({ size, restoreTo: null })
  },
  widenForDetail: () => {
    if (get().size === 'normal') set({ size: 'wide', restoreTo: 'normal' })
  },
  restoreAfterDetail: () => {
    const { restoreTo } = get()
    if (restoreTo) set({ size: restoreTo, restoreTo: null })
  },
}))
