import type { ReactNode } from 'react'

type StateMessageProps = {
  tone?: 'muted' | 'error'
  children: ReactNode
}

/** 조회 상태 표시: 로딩 · 오류 · 빈 목록 */
export function StateMessage({ tone = 'muted', children }: StateMessageProps) {
  return (
    <p className={tone === 'error' ? 'text-destructive text-sm' : 'text-muted-foreground text-sm'}>
      {children}
    </p>
  )
}
