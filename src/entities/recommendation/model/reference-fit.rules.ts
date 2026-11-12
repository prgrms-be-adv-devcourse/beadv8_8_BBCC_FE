import type { Fit, SizeRecommendation } from './recommendation'
import { GARMENT_PART_SPEC, MEASUREMENT_LABEL } from './reference-garment'

/** 추천 사이즈의 항목별 AI 판단 이름표 */
const JUDGEMENT_LABEL: Record<Fit, string> = {
  TIGHT: '여유 부족',
  PROPER: '여유 적당',
  ROOMY: '여유 넉넉',
}

export type ReferenceFitSummary = {
  /** 비교한 기준 옷 칸 이름 (상의 · 바지 …) */
  partLabel: string
  /** 다른 칸의 기준 옷으로 대신 비교했으면 true (너비 항목만) */
  isSubstitute: boolean
  items: { label: string; diffText: string; judgement: string | null }[]
}

/** 차이(상품 − 기준 옷)를 소수 첫째 자리로: +1.5cm · −0.5cm, 0이 되면 같음 */
function diffTextOf(diffCm: number): string {
  const tenths = Math.round(diffCm * 10)
  if (tenths === 0) return '같음'
  const text = `${(Math.abs(tenths) / 10).toFixed(1)}cm`
  return tenths > 0 ? `+${text}` : `−${text}`
}

/**
 * 사이즈 추천 상자의 기준 핏: 추천 사이즈에서 기준 옷과 항목별 차이와 AI 판단.
 * 모르는 실측 코드는 사용자 화면에서 뺀다. 추천 사이즈 · 기준 핏 · 보여 줄 항목이 없으면 null
 */
export function referenceFitSummaryOf({
  recommendedSize,
  referenceFit,
  itemJudgements,
}: Pick<
  SizeRecommendation,
  'recommendedSize' | 'referenceFit' | 'itemJudgements'
>): ReferenceFitSummary | null {
  if (!recommendedSize || !referenceFit) return null
  const items = referenceFit.items.flatMap(({ code, sizes }) => {
    const label = MEASUREMENT_LABEL[code]
    const diffCm = sizes.find((size) => size.size === recommendedSize)?.diffCm
    if (!label || diffCm === undefined) return []
    const judgement = itemJudgements.find((item) => item.code === code)?.fit
    return [
      {
        label,
        diffText: diffTextOf(diffCm),
        judgement: judgement ? JUDGEMENT_LABEL[judgement] : null,
      },
    ]
  })
  if (items.length === 0) return null
  return {
    partLabel: GARMENT_PART_SPEC[referenceFit.comparedPart].label,
    isSubstitute: referenceFit.comparedPart !== referenceFit.productPart,
    items,
  }
}
