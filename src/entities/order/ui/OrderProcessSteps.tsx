import { useEffect, useState } from 'react'
import { cn } from '@/shared/lib'
import type { Order } from '../model/order'
import { orderProcess, type ProcessStepState } from '../model/order.rules'

type OrderProcessStepsProps = {
  order: Pick<Order, 'status' | 'cancelReason' | 'orderedAt'>
  /** 단계 아래에 서버 이벤트 이름을 보여 준다 (시연 콘솔) */
  showEvents?: boolean
}

const MARK: Record<ProcessStepState, string> = {
  done: '✓',
  active: '',
  waiting: '',
  failed: '✕',
  skipped: '–',
}

/** 주문하기 뒤 서버 처리: 주문 접수 → 재고 확보 → 예치금 결제. 처리 중이면 지난 시간을 센다 */
export function OrderProcessSteps({ order, showEvents = false }: OrderProcessStepsProps) {
  const steps = orderProcess(order)
  const pending = order.status === 'PENDING_PAYMENT'
  const elapsed = useElapsedSeconds(order.orderedAt, pending)

  return (
    <div className="space-y-2">
      <ol aria-label="서버 처리 단계" className="flex items-start">
        {steps.map((step, index) => (
          <li key={step.event} className="flex flex-1 items-start last:flex-none">
            <div className="flex w-20 flex-col items-center gap-1 text-center">
              <span
                aria-hidden
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold',
                  step.state === 'done' && 'border-primary bg-primary text-primary-foreground',
                  step.state === 'active' && 'border-primary animate-spin border-t-transparent',
                  step.state === 'waiting' && 'border-muted-foreground/30',
                  step.state === 'failed' && 'border-destructive bg-destructive text-white',
                  step.state === 'skipped' && 'border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {MARK[step.state]}
              </span>
              <span
                className={cn(
                  'text-xs font-medium',
                  step.state === 'failed' && 'text-destructive',
                  (step.state === 'waiting' || step.state === 'skipped') && 'text-muted-foreground',
                )}
              >
                {step.label}
                <span className="sr-only"> ({step.state})</span>
              </span>
              {step.note && (
                <span
                  className={cn(
                    'text-[11px]',
                    step.state === 'failed' ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {step.note}
                </span>
              )}
              {showEvents && (
                <span className="text-muted-foreground font-mono text-[10px]">{step.event}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'mt-4 h-0.5 flex-1',
                  steps[index + 1].state === 'done' || steps[index + 1].state === 'failed'
                    ? 'bg-primary'
                    : 'bg-muted-foreground/20',
                )}
              />
            )}
          </li>
        ))}
      </ol>
      {pending && elapsed !== null && (
        <p className="text-muted-foreground text-center text-xs">
          서버가 이벤트로 처리하는 중 · {elapsed}초째
        </p>
      )}
    </div>
  )
}

/** 주문 시각부터 지난 초 (처리 중일 때만 1초마다 갱신) */
function useElapsedSeconds(from: string, running: boolean): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])
  const start = new Date(from).getTime()
  if (!running || Number.isNaN(start)) return null
  return Math.max(0, Math.round((now - start) / 1000))
}
