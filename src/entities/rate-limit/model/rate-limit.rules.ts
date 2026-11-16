import {
  PERIOD_UNIT_LABEL,
  PERIOD_UNIT_MS,
  PERIOD_UNITS,
  type PeriodUnit,
  type RateLimit,
} from './rate-limit'

/** 기간이 나누어떨어지는 가장 큰 단위. 밀리초는 늘 나누어떨어진다 */
export function periodUnitOf(periodMs: number): PeriodUnit {
  return PERIOD_UNITS.find((unit) => periodMs % PERIOD_UNIT_MS[unit] === 0) ?? 'millisecond'
}

/** 예: 1초 · 90초 · 2시간 */
export function formatPeriod(periodMs: number): string {
  const unit = periodUnitOf(periodMs)
  return `${periodMs / PERIOD_UNIT_MS[unit]}${PERIOD_UNIT_LABEL[unit]}`
}

/** 예: 1분에 200건 */
export function formatRateLimit(limit: RateLimit): string {
  return `${formatPeriod(limit.periodMs)}에 ${limit.capacity.toLocaleString('ko-KR')}건`
}
