import { useId, useState, type FormEvent } from 'react'
import {
  formatRateLimit,
  PERIOD_UNIT_LABEL,
  PERIOD_UNITS,
  RATE_LIMIT_TARGET_DESCRIPTION,
  RATE_LIMIT_TARGET_LABEL,
  type PeriodUnit,
  type RateLimit,
  type RateLimitTarget,
} from '@/entities/rate-limit'
import { getErrorMessage } from '@/shared/api'
import { confirmAction, withObjectParticle } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import {
  toRateLimit,
  toRateLimitForm,
  validateRateLimitForm,
  type RateLimitForm as RateLimitFormValues,
} from '../model/rate-limit-form.rules'
import { useChangeRateLimit } from '../model/use-change-rate-limit'

type RateLimitFormProps = {
  target: RateLimitTarget
  /** 지금 서버가 쓰는 한도. 입력 칸의 처음 값이다 */
  limit: RateLimit
}

/** 한도 하나(사용자별 · 전체)를 "기간에 건수"로 바꾼다. 모든 사용자에게 바로 영향이 있어 확인 창을 거친다 */
export function RateLimitForm({ target, limit }: RateLimitFormProps) {
  const change = useChangeRateLimit()
  const [form, setForm] = useState<RateLimitFormValues>(() => toRateLimitForm(limit))
  const [invalid, setInvalid] = useState<string | null>(null)
  const titleId = useId()
  const label = RATE_LIMIT_TARGET_LABEL[target]

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const problem = validateRateLimitForm(form)
    setInvalid(problem)
    if (problem) return
    const next = toRateLimit(form)
    const confirmed = await confirmAction({
      title: `${withObjectParticle(label)} ${formatRateLimit(next)}으로 바꿀까요?`,
      description: '모든 사용자에게 2초 안에 적용돼요.',
      confirmLabel: '바꾸기',
    })
    if (!confirmed) return
    change.mutate({ target, limit: next })
  }

  return (
    <section aria-labelledby={titleId} className="space-y-3 px-5 py-4">
      <div className="space-y-0.5">
        <h2 id={titleId} className="text-ink text-[15px] font-bold">
          {label}
          <span className="figure text-ink-2 ml-2 text-sm font-semibold">
            {formatRateLimit(limit)}
          </span>
        </h2>
        <p className="text-ink-3 text-[13px]">{RATE_LIMIT_TARGET_DESCRIPTION[target]}</p>
      </div>
      <form className="flex flex-wrap items-center gap-2 text-sm" onSubmit={handleSubmit}>
        <Input
          aria-label={`${label} 기간`}
          type="number"
          inputMode="numeric"
          className="figure w-20 max-lg:h-11"
          value={form.periodAmount}
          onChange={(e) => setForm({ ...form, periodAmount: e.target.value })}
        />
        <Select
          aria-label={`${label} 기간 단위`}
          className="w-24 max-lg:h-11"
          value={form.periodUnit}
          onChange={(e) => setForm({ ...form, periodUnit: e.target.value as PeriodUnit })}
        >
          {PERIOD_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {PERIOD_UNIT_LABEL[unit]}
            </option>
          ))}
        </Select>
        <span>에</span>
        <Input
          aria-label={`${label} 건수`}
          type="number"
          inputMode="numeric"
          className="figure w-28 max-lg:h-11"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
        <span>건</span>
        <Button type="submit" className="max-lg:h-11" disabled={change.isPending}>
          저장
        </Button>
      </form>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {change.isError && <StateMessage tone="error">{getErrorMessage(change.error)}</StateMessage>}
    </section>
  )
}
