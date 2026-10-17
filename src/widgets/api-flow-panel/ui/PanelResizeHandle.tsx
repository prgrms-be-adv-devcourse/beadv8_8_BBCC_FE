import { useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { clampPanelWidth, usePanelSize } from '../model/panel-size'

type PanelResizeHandleProps = {
  /** 시연 화면 + 패널을 담은 그리드 (오른쪽 끝 기준으로 폭을 잰다) */
  containerRef: RefObject<HTMLElement | null>
  /** 지금 패널 폭 (키보드 조절 · 화면 읽기 프로그램용) */
  panelRef: RefObject<HTMLElement | null>
}

const STEP_PX = 40

/** 시연 화면과 API 흐름 사이 세로 손잡이: 끌거나 ← → 로 폭 조절, 더블클릭하면 보통 폭 */
export function PanelResizeHandle({ containerRef, panelRef }: PanelResizeHandleProps) {
  const setWidth = usePanelSize((state) => state.setWidth)
  const setSize = usePanelSize((state) => state.setSize)
  // 손잡이로 맞춘 폭이면 그 값 (화면 읽기 프로그램용)
  const customWidth = usePanelSize((state) => (state.size === 'custom' ? state.width : undefined))
  const dragging = useRef(false)

  const resizeTo = (clientX: number) => {
    const box = containerRef.current?.getBoundingClientRect()
    if (!box) return
    setWidth(clampPanelWidth(box.right - clientX, box.width))
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) resizeTo(event.clientX)
  }
  const stop = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    dragging.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const box = containerRef.current?.getBoundingClientRect()
    if (!box || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
    event.preventDefault()
    // 손잡이를 왼쪽으로 → 패널이 넓어진다
    const panelWidth = panelRef.current?.getBoundingClientRect().width ?? 0
    const next = panelWidth + (event.key === 'ArrowLeft' ? STEP_PX : -STEP_PX)
    setWidth(clampPanelWidth(next, box.width))
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="API 흐름 폭 조절"
      aria-valuenow={customWidth}
      tabIndex={0}
      title="끌어서 폭 조절 · 더블클릭하면 보통 폭"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
      onDoubleClick={() => setSize('normal')}
      onKeyDown={onKeyDown}
      className="group hover:bg-primary/15 focus-visible:bg-primary/20 relative flex cursor-col-resize touch-none items-center justify-center bg-transparent outline-none"
    >
      <span
        aria-hidden
        className="text-muted-foreground group-hover:text-primary pointer-events-none text-xs leading-none select-none"
      >
        ⋮
      </span>
    </div>
  )
}
