import type { GrowthRecord } from './child'

/**
 * 아동복 사이즈 구간. 일반 표기로 호칭이 키 기준이다 (120 = 키 115 이상 125 미만).
 * 브랜드마다 다를 수 있어 화면에는 "일반 표기 기준"이라고 적는다
 */
export type SizeBand = { size: number; minCm: number; maxCm: number }

export function sizeBandOf(heightCm: number): SizeBand {
  const size = Math.round(heightCm / 10) * 10
  return { size, minCm: size - 5, maxCm: size + 5 }
}

const DAY_MS = 86_400_000
const MONTH_DAYS = 30.44
/** 이보다 짧은 기간의 기록으로는 속도를 내지 않는다 */
const MIN_SPAN_DAYS = 28
/** 이보다 멀면 "한참 뒤"로만 말한다 */
const MAX_FORECAST_MONTHS = 36

export type GrowthForecast = {
  heightCm: number
  band: SizeBand
  /** 한 달에 자라는 키 (cm). 기록이 모자라면 null */
  cmPerMonth: number | null
  /** 다음 사이즈 구간까지 남은 달 (0.5 단위). 속도를 모르거나 너무 멀면 null */
  monthsToNext: number | null
}

/** 날짜 문자열 → 일 수 (서버 시각끼리만 비교한다) */
const dayOf = (value: string) =>
  Date.parse(value.length <= 10 ? `${value}T00:00:00Z` : `${value.slice(0, 19)}Z`) / DAY_MS

/** 기록의 최소제곱 기울기 (cm/일) */
function slopePerDay(records: GrowthRecord[]): number | null {
  const points = records
    .map((record) => ({ x: dayOf(record.recordedAt), y: record.heightCm }))
    .filter((point) => Number.isFinite(point.x))
  if (points.length < 2) return null
  const xs = points.map((point) => point.x)
  if (Math.max(...xs) - Math.min(...xs) < MIN_SPAN_DAYS) return null
  const meanX = xs.reduce((sum, x) => sum + x, 0) / points.length
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length
  const sxx = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0)
  const sxy = points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0)
  return sxx === 0 ? null : sxy / sxx
}

/** 아이 기록으로 낸 추정: 지금 사이즈 구간과, 지금 속도로 다음 구간까지 남은 달 */
export function forecastGrowth(records: GrowthRecord[], currentHeightCm: number): GrowthForecast {
  const band = sizeBandOf(currentHeightCm)
  const slope = slopePerDay(records)
  const cmPerMonth = slope !== null && slope > 0 ? Math.round(slope * MONTH_DAYS * 10) / 10 : null
  const months =
    cmPerMonth && cmPerMonth > 0 ? (band.maxCm - currentHeightCm) / (slope! * MONTH_DAYS) : null
  return {
    heightCm: currentHeightCm,
    band,
    cmPerMonth,
    monthsToNext:
      months !== null && months <= MAX_FORECAST_MONTHS
        ? Math.max(0.5, Math.round(months * 2) / 2)
        : null,
  }
}
