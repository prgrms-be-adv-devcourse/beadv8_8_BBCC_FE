import { describe, expect, it } from 'vitest'
import { growthSpeedTextOf, type GrowthSpeed } from '@/entities/recommendation'

// 사이즈 추천 상자의 성장 속도 줄: 예상치라 숫자에 「약」을 붙이고 「예상해요」로 끝낸다.
// 아이 기록 비중이 0이면 또래 평균, 1 ~ 99면 아이 기록과 또래 평균, 100이면 아이 기록으로 본 값이다.
// cm는 소수 첫째 자리로 반올림하고, 0.0이 되면(키가 거의 그대로) 숫자 대신 그 사실을 쓴다

const speed = (patch: Partial<GrowthSpeed>): GrowthSpeed => ({
  cmPerMonth: 0.55,
  recentCmPerMonth: null,
  recordCount: 3,
  recordMonths: 3.5,
  childSharePercent: 40,
  tableCmPerMonth: 0.55,
  tableSource: '한국아동패널',
  ...patch,
})

describe('growthSpeedTextOf', () => {
  it.each([
    [0, 0, '또래 평균으로 보면 한 달에 약 0.6cm씩 클 것으로 예상해요 · 아직 성장 기록이 없어요'],
    [
      0,
      2,
      '또래 평균으로 보면 한 달에 약 0.6cm씩 클 것으로 예상해요 · 기록이 한 달 넘게 쌓이면 반영해요',
    ],
    [1, 3, '우리 아이 기록과 또래 평균으로 보면 한 달에 약 0.6cm씩 클 것으로 예상해요'],
    [99, 3, '우리 아이 기록과 또래 평균으로 보면 한 달에 약 0.6cm씩 클 것으로 예상해요'],
    [100, 3, '우리 아이 기록으로 보면 한 달에 약 0.6cm씩 클 것으로 예상해요'],
  ])('비중 %i% · 기록 %i회: %s', (childSharePercent, recordCount, text) => {
    expect(growthSpeedTextOf(speed({ childSharePercent, recordCount }))).toBe(text)
  })

  it.each([
    [0.05, '한 달에 약 0.1cm씩'],
    [0.55, '한 달에 약 0.6cm씩'],
    [1.25, '한 달에 약 1.3cm씩'],
  ])('%scm는 소수 첫째 자리로 반올림한다', (cmPerMonth, part) => {
    expect(growthSpeedTextOf(speed({ cmPerMonth }))).toContain(part)
  })

  it.each([0, 0.04])('%scm처럼 0.0이 되면 「키가 거의 그대로」라고 쓴다', (cmPerMonth) => {
    expect(growthSpeedTextOf(speed({ cmPerMonth, childSharePercent: 100 }))).toBe(
      '최근 기록으로는 키가 거의 그대로예요',
    )
  })
})
