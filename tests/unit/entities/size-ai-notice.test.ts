import { describe, expect, it } from 'vitest'
import { showsAiSizeNotice, type SizeReason } from '@/entities/recommendation'

// 사이즈 추천 근거 아래 AI 안내: AI가 정한 추천이고 보여 줄 근거 문장이 있을 때만 보인다

const reason: SizeReason = { type: 'HEIGHT', detail: '키 118cm는 120 권장 키 안이에요.' }

describe('showsAiSizeNotice', () => {
  it('AI가 정하고 근거가 있으면 보인다', () => {
    expect(showsAiSizeNotice({ source: 'AI', reasons: [reason] })).toBe(true)
  })

  it.each([
    ['규칙이 정했으면', { source: 'RULE', reasons: [] }],
    ['규칙인데 근거가 있어도', { source: 'RULE', reasons: [reason] }],
    ['AI가 정했어도 근거가 없으면', { source: 'AI', reasons: [] }],
  ] as const)('%s 보이지 않는다', (_case, recommendation) => {
    expect(showsAiSizeNotice({ ...recommendation, reasons: [...recommendation.reasons] })).toBe(
      false,
    )
  })
})
