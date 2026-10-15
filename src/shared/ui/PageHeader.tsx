import type { ReactNode } from 'react'
import { useArea } from '@/shared/lib'
import { MockBadge } from './MockBadge'

type PageHeaderProps = {
  title: string
  step?: string
  description?: ReactNode
  note?: ReactNode
  actions?: ReactNode
  /** 화면 전체가 목이면 그 엔드포인트 (제목 옆 "준비 중(목)") */
  mockEndpoints?: string[]
}

/**
 * 화면 제목 + 설명 + 오른쪽 동작.
 * step(①~⑦) · note(백엔드 처리 설명)는 시연 콘솔에서만 보인다. 같은 화면을 쇼핑 · 판매자 센터 · 관리자에서도 쓴다
 */
export function PageHeader({
  title,
  step,
  description,
  note,
  actions,
  mockEndpoints,
}: PageHeaderProps) {
  const inConsole = useArea() === 'console'
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold">
          {inConsole && step && <span className="text-primary mr-1">{step}</span>}
          {title}
          {mockEndpoints && <MockBadge endpoints={mockEndpoints} />}
        </h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        {inConsole && note && <p className="text-muted-foreground mt-1 text-sm">{note}</p>}
      </div>
      {actions}
    </div>
  )
}
