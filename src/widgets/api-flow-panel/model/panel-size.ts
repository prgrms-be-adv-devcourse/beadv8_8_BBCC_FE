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

type PanelSizeState = { size: PanelSize; setSize: (size: PanelSize) => void }

export const usePanelSize = create<PanelSizeState>()((set) => ({
  size: load(),
  setSize: (size) => {
    try {
      localStorage.setItem(STORAGE_KEY, size)
    } catch {
      // 이 탭에서만 유지
    }
    set({ size })
  },
}))
