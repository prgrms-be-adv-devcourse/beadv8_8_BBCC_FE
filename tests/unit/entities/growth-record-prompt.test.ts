import { describe, expect, it } from 'vitest'
import { growthRecordPromptOf, type GrowthSpeed } from '@/entities/recommendation'

// 자녀 상세 성장 그래프 아래의 기록 권유 문장: 성장 속도에 아이 기록이 전혀 반영되지 않았을 때만
// (아이 기록 비중 0 = 한 달 이상 떨어진 기록이 2개가 안 됨) 보인다

const speed = (childSharePercent: number): GrowthSpeed => ({
  cmPerMonth: 0.55,
  recentCmPerMonth: null,
  recordCount: 1,
  recordMonths: 0,
  childSharePercent,
  tableCmPerMonth: 0.55,
  tableSource: '한국아동패널',
})

describe('growthRecordPromptOf', () => {
  it('아이 기록 비중이 0이면 키 기록을 권한다', () => {
    expect(growthRecordPromptOf(speed(0))).toBe(
      '한 달에 한 번 키를 기록해 주세요. 한 달 이상 떨어진 기록이 2개 넘게 쌓이면 우리 아이 기록으로 계산해 더 정확해져요.',
    )
  })

  it.each([1, 40, 100])('아이 기록 비중이 %i이면 권하지 않는다', (childSharePercent) => {
    expect(growthRecordPromptOf(speed(childSharePercent))).toBeNull()
  })
})
