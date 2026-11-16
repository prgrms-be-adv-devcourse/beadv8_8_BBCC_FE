/**
 * 아동복 사이즈 구간. 일반 표기로 호칭이 키 기준이다 (120 = 키 115 이상 125 미만).
 * 브랜드마다 다를 수 있어 화면에는 "일반 표기 기준"이라고 적는다
 */
export type SizeBand = { size: number; minCm: number; maxCm: number }

export function sizeBandOf(heightCm: number): SizeBand {
  const size = Math.round(heightCm / 10) * 10
  return { size, minCm: size - 5, maxCm: size + 5 }
}

/** 이보다 멀면 "한참 뒤"로만 말한다 */
const MAX_FORECAST_MONTHS = 36

export type GrowthForecast = {
  heightCm: number
  band: SizeBand
  /** 한 달에 자라는 키 (cm, 소수 첫째 자리). 아직 받지 못했으면 null */
  cmPerMonth: number | null
  /** 다음 사이즈 구간까지 남은 달 (0.5 단위). 속도를 모르거나, 자라지 않거나, 너무 멀면 null */
  monthsToNext: number | null
  /** 자라고는 있지만 다음 사이즈가 36개월보다 멀다 */
  isFarAway: boolean
}

/**
 * 지금 사이즈 구간과, 받은 속도로 다음 구간까지 남은 달. 속도는 백엔드가 계산한 한 달 성장량(cm)을 받는다
 * (아이 기록이 모자라면 또래 평균). 0.0cm로 반올림되는 속도는 자라지 않는 것으로 보고 남은 달을 내지 않는다
 */
export function forecastGrowth(currentHeightCm: number, cmPerMonth: number | null): GrowthForecast {
  const band = sizeBandOf(currentHeightCm)
  const base = { heightCm: currentHeightCm, band, monthsToNext: null, isFarAway: false }
  if (cmPerMonth === null) return { ...base, cmPerMonth: null }
  const shown = Math.round(cmPerMonth * 10) / 10
  if (shown <= 0) return { ...base, cmPerMonth: 0 }
  const months = (band.maxCm - currentHeightCm) / cmPerMonth
  if (months > MAX_FORECAST_MONTHS) return { ...base, cmPerMonth: shown, isFarAway: true }
  return { ...base, cmPerMonth: shown, monthsToNext: Math.max(0.5, Math.round(months * 2) / 2) }
}
