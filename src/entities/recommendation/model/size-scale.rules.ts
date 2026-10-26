import type { SizeRange } from './recommendation'

/** 눈금 양 끝 여유 (cm) */
const EDGE_CM = 2

export type SizeScale = {
  /** 사이즈마다 권장 키 칸 (권장 키 순서, 눈금 왼쪽 끝 기준 %) */
  segments: { size: string; startPct: number; endPct: number }[]
  /** 자녀 키 핀 위치 (%) */
  heightPct: number
}

const round2 = (value: number) => Math.round(value * 100) / 100

/** 상품 상세 사이즈 눈금: 이 상품의 사이즈별 권장 키를 한 줄에 놓고 자녀 키를 꽂는다 */
export function sizeScaleOf(sizes: SizeRange[], heightCm: number): SizeScale {
  if (sizes.length === 0) return { segments: [], heightPct: 50 }
  const sorted = [...sizes].sort((a, b) => a.minHeightCm - b.minHeightCm)
  const fromCm = Math.min(sorted[0].minHeightCm, heightCm) - EDGE_CM
  const toCm = Math.max(...sorted.map((size) => size.maxHeightCm), heightCm) + EDGE_CM
  const pct = (cm: number) => round2(((cm - fromCm) / (toCm - fromCm)) * 100)
  return {
    segments: sorted.map((size) => ({
      size: size.size,
      startPct: pct(size.minHeightCm),
      endPct: pct(size.maxHeightCm),
    })),
    heightPct: pct(heightCm),
  }
}
