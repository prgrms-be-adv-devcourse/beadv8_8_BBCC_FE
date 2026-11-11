import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

/** 카드 사이 나타나는 간격 (거의 함께 나타난다) */
const STEP_MS = 90

type PickRevealProps = {
  /** 몇 번째 카드인지 (0부터) */
  index: number
  children: ReactNode
  className?: string
}

/** AI 추천 카드 한 칸(li): 로딩하던 자리에서 움직이지 않고 부드럽게 나타난다. 동작 줄이기 설정이면 바로 보인다 */
export function PickReveal({ index, children, className }: PickRevealProps) {
  return (
    <li
      className={cn(
        'animate-in fade-in fill-mode-both duration-[350ms] motion-reduce:animate-none',
        className,
      )}
      style={{ animationDelay: `${index * STEP_MS}ms` }}
    >
      {children}
    </li>
  )
}
