import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

/** 카드 사이 나타나는 간격 */
const STEP_MS = 180

type PickRevealProps = {
  /** 몇 번째 카드인지 (0부터). 늦게 올수록 늦게 나타난다 */
  index: number
  children: ReactNode
  className?: string
}

/** AI 추천 카드 한 칸(li): 차례로 아래에서 떠오른다. 동작 줄이기 설정이면 한 번에 보인다 */
export function PickReveal({ index, children, className }: PickRevealProps) {
  return (
    <li
      className={cn(
        'animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500 motion-reduce:animate-none',
        className,
      )}
      style={{ animationDelay: `${index * STEP_MS}ms` }}
    >
      {children}
    </li>
  )
}
