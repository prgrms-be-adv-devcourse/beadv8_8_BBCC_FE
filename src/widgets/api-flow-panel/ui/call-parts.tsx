import type { DomainId, FlowStep } from '../config/domain-flow'

const DOMAIN_NAME: Record<DomainId, string> = {
  member: '회원',
  product: '상품',
  recommend: '추천',
  order: '주문',
  payment: '결제',
  settlement: '정산',
  toss: '토스',
  kakao: '카카오',
  s3: 'S3',
}

type FlowStepsProps = { steps: FlowStep[] }

/** 성공한 호출 뒤 서버에서 이어지는 처리 (설계 기준) */
export function FlowSteps({ steps }: FlowStepsProps) {
  return (
    <div className="rounded border border-dashed p-1.5">
      <div className="text-muted-foreground mb-1 text-[11px]">
        서버에서 이어지는 처리 (설계 기준)
      </div>
      <ol className="space-y-0.5">
        {steps.map((step) => (
          <li key={step.name}>
            <span className="text-primary font-mono font-semibold">{step.name}</span>{' '}
            <span className="text-muted-foreground">
              {DOMAIN_NAME[step.from]} → {step.to.map((to) => DOMAIN_NAME[to]).join(' · ')}
            </span>
            <div className="text-muted-foreground pl-2">{step.description}</div>
          </li>
        ))}
      </ol>
    </div>
  )
}

type JsonBlockProps = { label: string; value: unknown }

export function JsonBlock({ label, value }: JsonBlockProps) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <pre className="bg-muted max-h-72 overflow-auto rounded p-1.5 text-[11px]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}
