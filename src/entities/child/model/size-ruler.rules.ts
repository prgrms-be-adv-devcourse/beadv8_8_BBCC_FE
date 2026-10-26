import { sizeBandOf, type SizeBand } from './growth-forecast'

/** 눈금자는 추천 사이즈를 가운데 두고 양쪽으로 이만큼 보여 준다 (cm) */
const HALF_SPAN_CM = 20

export type SizeRuler = {
  heightCm: number
  band: SizeBand
  fromCm: number
  toCm: number
  /** 사이즈 호칭 눈금 (10cm마다) */
  marks: number[]
  /** 눈금자 왼쪽 끝 기준 위치 (%) */
  heightPct: number
  bandStartPct: number
  bandEndPct: number
  /** 이 사이즈를 더 입을 수 있는 키 (구간 끝까지, 소수 첫째 자리) */
  roomCm: number
}

/** 아이 키를 추천 사이즈 구간 위에 놓은 눈금자 (홈 맞춤 영역 · 맞춤 목록 머리) */
export function sizeRulerOf(heightCm: number): SizeRuler {
  const band = sizeBandOf(heightCm)
  const fromCm = band.size - HALF_SPAN_CM
  const toCm = band.size + HALF_SPAN_CM
  const pct = (cm: number) => ((cm - fromCm) / (toCm - fromCm)) * 100
  const marks: number[] = []
  for (let cm = fromCm; cm <= toCm; cm += 10) marks.push(cm)
  return {
    heightCm,
    band,
    fromCm,
    toCm,
    marks,
    heightPct: pct(heightCm),
    bandStartPct: pct(band.minCm),
    bandEndPct: pct(band.maxCm),
    roomCm: Math.round((band.maxCm - heightCm) * 10) / 10,
  }
}
