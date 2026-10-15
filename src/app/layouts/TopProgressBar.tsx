import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigation } from 'react-router'

/** 짧은 요청에는 깜빡이지 않도록 이만큼 지나도 끝나지 않을 때만 보여 준다 */
const SHOW_DELAY_MS = 200

/**
 * 시연 막대 바로 아래 얇은 진행 막대: 화면을 불러오는 중(라우터) · 처음 조회 중 · 저장 중일 때.
 * 주문 상세의 결제 결과 다시 조회 같은 백그라운드 조회는 세지 않는다 (막대가 계속 깜빡이지 않게)
 */
export function TopProgressBar() {
  const navigating = useNavigation().state !== 'idle'
  const loading = useIsFetching({ predicate: (query) => query.state.status === 'pending' }) > 0
  const saving = useIsMutating() > 0
  const busy = navigating || loading || saving
  const [delayed, setDelayed] = useState(false)

  useEffect(() => {
    if (!busy) return
    const timer = setTimeout(() => setDelayed(true), SHOW_DELAY_MS)
    return () => {
      clearTimeout(timer)
      setDelayed(false)
    }
  }, [busy])

  if (!busy || !delayed) return null
  return (
    <div
      role="progressbar"
      aria-label="불러오는 중"
      className="pointer-events-none fixed inset-x-0 top-11 z-50 h-0.5 overflow-hidden"
    >
      <div className="top-progress bg-primary h-full w-1/3" />
    </div>
  )
}
