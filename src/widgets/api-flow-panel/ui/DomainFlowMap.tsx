import { cn } from '@/shared/lib'
import { DOMAINS, type DomainId } from '../config/domain-flow'

type DomainFlowMapProps = {
  called: Set<DomainId>
  followed: Set<DomainId>
}

/** 도메인 노드. 직접 호출된 도메인은 진하게, 서버 이벤트로 이어진 도메인은 테두리로 표시한다 */
export function DomainFlowMap({ called, followed }: DomainFlowMapProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {DOMAINS.map((domain) => (
        <div
          key={domain.id}
          className={cn(
            'rounded-md border px-1 py-1.5 text-center text-xs transition-colors',
            domain.external && 'border-dashed',
            called.has(domain.id) && 'bg-primary text-primary-foreground border-primary',
            !called.has(domain.id) &&
              followed.has(domain.id) &&
              'border-primary text-primary border-2 font-semibold',
          )}
        >
          {domain.name}
        </div>
      ))}
    </div>
  )
}
