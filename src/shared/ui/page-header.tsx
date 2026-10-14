import * as React from 'react'

/** 화면 제목 + 설명 + 오른쪽 동작 */
function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
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
