import { cn } from '@/shared/lib'

type Props = { steps: readonly string[]; current: number; cancelled: boolean }

/** 주문 → 결제 완료 → 배송 중 → 배송 완료 → 구매확정 진행 막대 (값은 orderProgress) */
export function OrderProgressBar({ steps, current, cancelled }: Props) {
  if (cancelled) {
    return (
      <p className="bg-destructive/10 text-destructive rounded-lg p-3 text-center text-sm font-semibold">
        취소된 주문이에요
      </p>
    )
  }
  return (
    <ol className="flex items-center" aria-label="주문 진행">
      {steps.map((step, index) => (
        <li key={step} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <span
              aria-current={index === current ? 'step' : undefined}
              className={cn(
                'flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold',
                index < current && 'border-primary bg-primary text-primary-foreground',
                index === current && 'border-primary text-primary bg-white',
                index > current && 'border-muted text-muted-foreground bg-white',
              )}
            >
              {index < current ? '✓' : index + 1}
            </span>
            <span
              className={cn(
                'text-xs whitespace-nowrap',
                index === current ? 'text-primary font-semibold' : 'text-muted-foreground',
              )}
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn('mx-2 mb-5 h-0.5 flex-1', index < current ? 'bg-primary' : 'bg-muted')}
            />
          )}
        </li>
      ))}
    </ol>
  )
}
