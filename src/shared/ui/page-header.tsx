import * as React from 'react'
import { useArea } from '@/shared/lib'

/**
 * 화면 제목 + 설명 + 오른쪽 동작.
 * step(①~⑦) · note(백엔드 처리 설명)는 시연 콘솔에서만 보인다. 같은 화면을 쇼핑 · 판매자 센터 · 관리자에서도 쓴다
 */
function PageHeader({
  title,
  step,
  description,
  note,
  actions,
}: {
  title: string
  step?: string
  description?: React.ReactNode
  note?: React.ReactNode
  actions?: React.ReactNode
}) {
  const inConsole = useArea() === 'console'
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold">
          {inConsole && step && <span className="text-primary mr-1">{step}</span>}
          {title}
        </h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        {inConsole && note && <p className="text-muted-foreground mt-1 text-sm">{note}</p>}
      </div>
      {actions}
    </div>
  )
}

/** 조회 상태 표시: 로딩 · 오류 · 빈 목록 */
function StateMessage({
  tone = 'muted',
  children,
}: {
  tone?: 'muted' | 'error'
  children: React.ReactNode
}) {
  return (
    <p className={tone === 'error' ? 'text-destructive text-sm' : 'text-muted-foreground text-sm'}>
      {children}
    </p>
  )
}

export { PageHeader, StateMessage }
