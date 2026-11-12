import { describe, expect, it } from 'vitest'
import {
  referenceFitSummaryOf,
  type ItemJudgement,
  type ReferenceFit,
  type SizeRecommendation,
} from '@/entities/recommendation'

// 상품 상세 사이즈 추천 상자의 기준 핏 한 줄: 추천 사이즈에서 기준 옷과 항목별 차이(상품 − 기준 옷)와 AI 판단.
// 모르는 실측 코드는 사용자 화면에 보이지 않게 뺀다 (원래 값은 흐름 패널 · 콘솔에서 본다)

const item = (code: string, diffCm: number) => ({
  code,
  garmentCm: 34,
  sizes: [
    { size: '110', productCm: 30, diffCm: -4 },
    { size: '120', productCm: 34 + diffCm, diffCm },
  ],
})

const fit = (items: ReferenceFit['items'], comparedPart: ReferenceFit['comparedPart'] = 'TOP') =>
  ({ productPart: 'TOP', comparedPart, items }) as ReferenceFit

const recommendation = (
  referenceFit: ReferenceFit | null,
  itemJudgements: ItemJudgement[] = [],
  recommendedSize: string | null = '120',
): Pick<SizeRecommendation, 'recommendedSize' | 'referenceFit' | 'itemJudgements'> => ({
  recommendedSize,
  referenceFit,
  itemJudgements,
})

const judged = (code: string, judgement: ItemJudgement['fit']): ItemJudgement => ({
  code,
  diffCm: 1.5,
  fit: judgement,
  allowanceMinCm: 0,
  allowanceMaxCm: 4,
})

describe('referenceFitSummaryOf', () => {
  it('추천 사이즈에서 기준 옷 칸 이름과 항목별 차이 · AI 판단을 돌려준다', () => {
    expect(
      referenceFitSummaryOf(
        recommendation(fit([item('TOTAL_LENGTH', 2), item('CHEST_WIDTH', 1.5)]), [
          judged('CHEST_WIDTH', 'PROPER'),
        ]),
      ),
    ).toEqual({
      partLabel: '상의',
      isSubstitute: false,
      items: [
        { label: '총장', diffText: '+2.0cm', judgement: null },
        { label: '가슴단면', diffText: '+1.5cm', judgement: '여유 적당' },
      ],
    })
  })

  it.each([
    [1.5, '+1.5cm'],
    [-0.5, '−0.5cm'],
    [0, '같음'],
    [-0.04, '같음'],
    [1.04, '+1.0cm'],
    [1.05, '+1.1cm'],
    [-2.26, '−2.3cm'],
  ])('차이 %scm는 %s로 쓴다 (소수 첫째 자리)', (diffCm, diffText) => {
    expect(
      referenceFitSummaryOf(recommendation(fit([item('CHEST_WIDTH', diffCm)])))?.items[0]?.diffText,
    ).toBe(diffText)
  })

  it.each([
    ['TIGHT', '여유 부족'],
    ['PROPER', '여유 적당'],
    ['ROOMY', '여유 넉넉'],
  ] as const)('AI 판단 %s는 「%s」', (judgement, label) => {
    expect(
      referenceFitSummaryOf(
        recommendation(fit([item('CHEST_WIDTH', 1)]), [judged('CHEST_WIDTH', judgement)]),
      )?.items[0]?.judgement,
    ).toBe(label)
  })

  it('다른 칸의 기준 옷으로 대신 비교했으면 그 칸 이름과 대신 비교했다는 표시를 준다', () => {
    const summary = referenceFitSummaryOf(
      recommendation({
        productPart: 'OUTER',
        comparedPart: 'TOP',
        items: [item('CHEST_WIDTH', 1)],
      }),
    )
    expect(summary).toMatchObject({ partLabel: '상의', isSubstitute: true })
  })

  it('아는 코드와 모르는 코드가 섞이면 모르는 코드만 뺀다', () => {
    expect(
      referenceFitSummaryOf(
        recommendation(fit([item('MYSTERY_CODE', 1), item('CHEST_WIDTH', 1)])),
      )?.items.map((row) => row.label),
    ).toEqual(['가슴단면'])
  })

  it.each([
    ['추천 사이즈가 없으면', recommendation(fit([item('CHEST_WIDTH', 1)]), [], null)],
    ['기준 옷이 없으면', recommendation(null)],
    ['추천 사이즈의 차이 값이 없으면', recommendation(fit([item('CHEST_WIDTH', 1)]), [], '130')],
    ['모르는 실측 코드만 있으면', recommendation(fit([item('MYSTERY_CODE', 1)]))],
  ])('%s null', (_case, input) => {
    expect(referenceFitSummaryOf(input)).toBeNull()
  })
})
