import { describe, expect, it } from 'vitest'
import { candidateNoteOf } from '@/entities/recommendation'

// AI는 규칙 후보 밖의 실제 사이즈를 고를 수 있다 (recommendedSize가 candidateSizes에 없음).
// 그때 「후보 110 · 120 중」이라고 쓰면 추천 사이즈가 후보에 있는 것처럼 읽혀 문구를 숨긴다
describe('candidateNoteOf: 「후보 … 중」 문구', () => {
  it.each([
    ['120', ['110', '120'], '후보 110 · 120 중'],
    ['120', ['120'], null],
    ['130', ['110', '120'], null],
    [null, [], null],
  ])('추천 %s · 후보 %j → %j', (recommendedSize, candidateSizes, expected) => {
    expect(candidateNoteOf({ recommendedSize, candidateSizes })).toBe(expected)
  })
})
