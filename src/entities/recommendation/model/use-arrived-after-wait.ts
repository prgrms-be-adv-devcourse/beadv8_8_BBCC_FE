import { useState } from 'react'

/** 떠오르는 줄이 앞줄보다 늦게 시작하는 시간 */
export const RISE_STEP_MS = 90

/**
 * 지금 그리는 답이 이 화면에서 기다린 끝에 온 것인지. 기다렸다가 온 답만 떠오르게 하고,
 * 저장된 답처럼 처음부터 그려진 답은 움직이지 않게 하는 데 쓴다.
 * subject(상품 · 자녀)가 바뀌면 그 대상으로 기다린 적이 있어야 다시 참이 된다
 */
export function useArrivedAfterWait(isWaiting: boolean, subject: string): boolean {
  const [waitedFor, setWaitedFor] = useState<string | null>(isWaiting ? subject : null)
  if (isWaiting && waitedFor !== subject) setWaitedFor(subject)
  return !isWaiting && waitedFor === subject
}
