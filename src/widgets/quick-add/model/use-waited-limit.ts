import { useEffect, useState } from 'react'

/**
 * 이 화면이 subject(상품 · 자녀)를 limitMs 넘게 기다렸는지. 기다림이 끝나면 시계를 멈추고,
 * 한 번 넘긴 대상은 넘긴 것으로 남는다 (다시 「추천 계산 중」으로 돌아가지 않게)
 */
export function useWaitedLimit(isWaiting: boolean, subject: string, limitMs: number): boolean {
  const [expiredFor, setExpiredFor] = useState<string | null>(null)
  useEffect(() => {
    if (!isWaiting) return
    const timer = setTimeout(() => setExpiredFor(subject), limitMs)
    return () => clearTimeout(timer)
  }, [isWaiting, subject, limitMs])
  return expiredFor === subject
}
