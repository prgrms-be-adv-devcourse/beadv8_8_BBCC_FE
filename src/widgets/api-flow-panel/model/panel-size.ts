import { create } from 'zustand'

/** 흐름 패널 폭: 보통(오른쪽) · 넓게(화면 절반) · 전체(API만) · 직접(손잡이로 맞춘 px) */
export type PanelSize = 'normal' | 'wide' | 'full' | 'custom'

/** 손잡이로 줄이고 늘릴 때 양쪽(시연 화면 · 패널)에 남기는 최소 폭 */
export const PANEL_MIN_PX = 360
/** 패널이 이 폭 이상이면 안을 좌우(목록 | 상세)로 나눈다 */
export const SPLIT_MIN_PX = 640

const SIZE_KEY = 'kidly.flow-panel-size'
const WIDTH_KEY = 'kidly.flow-panel-width'

type Saved = { size: PanelSize; width: number }

function load(): Saved {
  try {
    const size = localStorage.getItem(SIZE_KEY)
    const width = Number(localStorage.getItem(WIDTH_KEY))
    if (size === 'custom' && width >= PANEL_MIN_PX) return { size, width }
    return { size: size === 'wide' || size === 'full' ? size : 'normal', width: 0 }
  } catch {
    return { size: 'normal', width: 0 }
  }
}

function save({ size, width }: Saved) {
  try {
    localStorage.setItem(SIZE_KEY, size)
    localStorage.setItem(WIDTH_KEY, String(width))
  } catch {
    // 이 탭에서만 유지
  }
}

/** 손잡이 위치 → 패널 폭 (양쪽 최소 폭을 지킨다) */
export function clampPanelWidth(width: number, containerWidth: number) {
  const max = Math.max(PANEL_MIN_PX, containerWidth - PANEL_MIN_PX)
  return Math.round(Math.min(max, Math.max(PANEL_MIN_PX, width)))
}

type PanelSizeState = Saved & {
  /** 상세를 보려고 잠깐 넓혔으면 원래 폭 (닫을 때 돌아간다) */
  restoreTo: Saved | null
  setSize: (size: Exclude<PanelSize, 'custom'>) => void
  /** 손잡이로 맞춘 폭 (px) */
  setWidth: (width: number) => void
  /** 패널이 좁아 위아래로 쌓여 있으면 잠깐 넓게 (저장하지 않음) */
  widenForDetail: (panelWidth: number) => void
  /** 잠깐 넓혔으면 원래 폭으로 */
  restoreAfterDetail: () => void
}

export const usePanelSize = create<PanelSizeState>()((set, get) => ({
  ...load(),
  restoreTo: null,
  setSize: (size) => {
    // 직접 고른 폭은 그대로 둔다
    save({ size, width: get().width })
    set({ size, restoreTo: null })
  },
  setWidth: (width) => {
    save({ size: 'custom', width })
    set({ size: 'custom', width, restoreTo: null })
  },
  widenForDetail: (panelWidth) => {
    const { size, width } = get()
    if (size !== 'full' && panelWidth < SPLIT_MIN_PX) {
      set({ size: 'wide', restoreTo: { size, width } })
    }
  },
  restoreAfterDetail: () => {
    const { restoreTo } = get()
    if (restoreTo) set({ ...restoreTo, restoreTo: null })
  },
}))

/** 시연 콘솔 그리드 열: 시연 화면 · 손잡이 · 패널 */
export function consoleColumns(size: PanelSize, width: number, presentation: boolean) {
  if (size === 'full') return '0 0 1fr'
  if (size === 'wide') return '1fr 6px 1fr'
  if (size === 'custom') return `1fr 6px min(${width}px, calc(100% - ${PANEL_MIN_PX}px))`
  return `1fr 6px ${presentation ? 560 : 440}px`
}
