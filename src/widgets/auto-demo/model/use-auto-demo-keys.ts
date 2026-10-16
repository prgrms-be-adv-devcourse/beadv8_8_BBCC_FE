import { useEffect } from 'react'
import { useAutoDemo } from './auto-demo-store'
import { nextAutoDemo, stopAutoDemo, togglePauseAutoDemo } from './run-auto-demo'

/** 입력 중인 칸에서는 키를 가로채지 않는다 */
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.closest('[role="dialog"]') !== null
  )
}

/** 자동 시연 중 키보드: Space 일시정지 · 계속, → 다음 단계, Esc 멈춤 */
export function useAutoDemoKeys() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return
      const { status } = useAutoDemo.getState()
      if (status !== 'running' && status !== 'paused') return
      if (event.key === ' ') {
        event.preventDefault()
        togglePauseAutoDemo()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        nextAutoDemo()
      } else if (event.key === 'Escape') {
        stopAutoDemo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
