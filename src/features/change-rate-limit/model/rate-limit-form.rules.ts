import {
  PERIOD_UNIT_MS,
  periodUnitOf,
  type PeriodUnit,
  type RateLimit,
} from '@/entities/rate-limit'

/** 한도 입력 칸. 입력 중 값이라 문자열로 둔다 */
export type RateLimitForm = { capacity: string; periodAmount: string; periodUnit: PeriodUnit }

/** 백엔드 Limit.capacity는 Integer */
export const RATE_LIMIT_CAPACITY_MAX = 2_147_483_647

const POSITIVE_INTEGER = /^[1-9]\d*$/

export function toRateLimitForm(limit: RateLimit): RateLimitForm {
  const unit = periodUnitOf(limit.periodMs)
  return {
    capacity: String(limit.capacity),
    periodAmount: String(limit.periodMs / PERIOD_UNIT_MS[unit]),
    periodUnit: unit,
  }
}

export function toRateLimit(form: RateLimitForm): RateLimit {
  return {
    capacity: Number(form.capacity),
    periodMs: Number(form.periodAmount) * PERIOD_UNIT_MS[form.periodUnit],
  }
}

/** 백엔드 Limit.isValid와 같은 조건 (건수 1 이상, 기간 1ms 이상). 문제가 없으면 null */
export function validateRateLimitForm(form: RateLimitForm): string | null {
  if (!POSITIVE_INTEGER.test(form.capacity)) return '건수는 1 이상의 정수로 입력해 주세요.'
  if (Number(form.capacity) > RATE_LIMIT_CAPACITY_MAX)
    return `건수는 ${RATE_LIMIT_CAPACITY_MAX.toLocaleString('ko-KR')}건까지 입력할 수 있어요.`
  if (!POSITIVE_INTEGER.test(form.periodAmount)) return '기간은 1 이상의 정수로 입력해 주세요.'
  if (!Number.isSafeInteger(toRateLimit(form).periodMs)) return '기간이 너무 길어요.'
  return null
}
