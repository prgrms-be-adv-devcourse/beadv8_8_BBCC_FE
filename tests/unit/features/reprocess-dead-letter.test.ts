import { describe, expect, it } from 'vitest'
import { reprocessOutcomeText } from '@/features/reprocess-dead-letter'

describe('reprocessOutcomeText: 재처리 결과 → 화면 문구', () => {
  it('성공', () => {
    expect(reprocessOutcomeText({ kind: 'REPROCESSED' })).toEqual({
      tone: 'success',
      text: '재처리했어요.',
    })
  })

  it('실패는 실패 예외 이름을 그대로 붙인다', () => {
    expect(
      reprocessOutcomeText({ kind: 'FAILED', failureType: 'java.lang.IllegalStateException' }),
    ).toEqual({
      tone: 'error',
      text: '다시 처리하지 못했어요. 실패 예외: java.lang.IllegalStateException',
    })
  })

  it('실패 예외가 없으면 예외 없이', () => {
    expect(reprocessOutcomeText({ kind: 'FAILED', failureType: null })).toEqual({
      tone: 'error',
      text: '다시 처리하지 못했어요.',
    })
  })

  it('이미 처리됨', () => {
    expect(reprocessOutcomeText({ kind: 'ALREADY_REPROCESSED' })).toEqual({
      tone: 'success',
      text: '이미 재처리된 메시지예요.',
    })
  })
})
