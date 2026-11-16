import { describe, expect, it } from 'vitest'
import { growthSourceLinesOf, type GrowthSpeed } from '@/entities/recommendation'

// 성장 속도 줄의 ⓘ 안내 창: 또래 평균 출처, 아이 기록을 반영했으면 횟수 · 기간, 마지막에 실제와 다를 수 있다는 안내.
// 성장이 0.0cm로 반올림되면 출처 대신 또래 평균 값과 기록을 확인해 보라는 안내를 쓴다

const DISCLAIMER =
  '아이마다 크는 속도가 달라 실제와 다를 수 있어요. 한 달에 한 번 키를 기록하면 더 정확해져요.'

const speed = (patch: Partial<GrowthSpeed>): GrowthSpeed => ({
  cmPerMonth: 0.55,
  recentCmPerMonth: null,
  recordCount: 3,
  recordMonths: 3.46,
  childSharePercent: 40,
  tableCmPerMonth: 0.55,
  tableSource: '한국아동패널',
  ...patch,
})

describe('growthSourceLinesOf', () => {
  it('또래 평균만 썼으면 출처와 안내만', () => {
    expect(growthSourceLinesOf(speed({ childSharePercent: 0, recordCount: 0 }))).toEqual([
      '또래 평균은 한국아동패널 자료로 계산했어요',
      DISCLAIMER,
    ])
  })

  it('아이 기록을 반영했으면 횟수와 기간(소수 첫째 자리)을 더한다', () => {
    expect(growthSourceLinesOf(speed({}))).toEqual([
      '또래 평균은 한국아동패널 자료로 계산했어요',
      '우리 아이 성장 기록 3회(3.5개월)를 함께 반영했어요',
      DISCLAIMER,
    ])
  })

  it.each([
    [3, '3개월'],
    [3.46, '3.5개월'],
    [12.04, '12개월'],
  ])('기록 기간 %s는 %s로 쓴다', (recordMonths, text) => {
    expect(growthSourceLinesOf(speed({ recordMonths }))[1]).toContain(`(${text})`)
  })

  it.each([0, 0.04])(
    '성장이 %scm로 0.0이 되면 또래 평균 값과 기록 확인 안내를 쓴다',
    (cmPerMonth) => {
      expect(
        growthSourceLinesOf(
          speed({ cmPerMonth, childSharePercent: 100, recordCount: 4, recordMonths: 5 }),
        ),
      ).toEqual([
        '또래 평균은 한 달에 약 0.6cm예요. 키를 잰 날짜와 값이 맞는지 확인해 보세요.',
        '우리 아이 성장 기록 4회(5개월)를 함께 반영했어요',
        DISCLAIMER,
      ])
    },
  )
})
