import { useId } from 'react'
import { getErrorMessage } from '@/shared/api'
import { cn, confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useChangeRateLimit } from '../model/use-change-rate-limit'

type RateLimitSwitchProps = { isEnabled: boolean }

/** 요청 수 제한 켜고 끄기. 끄면 서버를 보호하지 못하므로 확인 창을 거친다 */
export function RateLimitSwitch({ isEnabled }: RateLimitSwitchProps) {
  const change = useChangeRateLimit()
  const titleId = useId()

  const handleToggle = async () => {
    const next = !isEnabled
    if (
      !next &&
      !(await confirmAction({
        title: '요청 수 제한을 끌까요?',
        description: '요청을 세지 않고 모두 받아요. 요청이 몰려도 서버를 보호하지 못해요.',
        confirmLabel: '끄기',
        tone: 'danger',
      }))
    )
      return
    change.mutate({ isEnabled: next })
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <h2 id={titleId} className="text-ink text-[15px] font-bold">
          요청 수 제한
        </h2>
        <p className="text-ink-3 text-[13px]">끄면 아래 한도와 상관없이 모든 요청을 받아요.</p>
        {change.isError && (
          <StateMessage tone="error">{getErrorMessage(change.error)}</StateMessage>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-4 self-end sm:self-auto">
        <span className={cn('text-sm font-semibold', isEnabled ? 'text-signal' : 'text-ink-3')}>
          {isEnabled ? '켜짐' : '꺼짐'}
        </span>
        <Button
          variant="outline"
          role="switch"
          aria-checked={isEnabled}
          aria-labelledby={titleId}
          className="max-lg:h-11"
          disabled={change.isPending}
          onClick={handleToggle}
        >
          {isEnabled ? '끄기' : '켜기'}
        </Button>
      </div>
    </section>
  )
}
