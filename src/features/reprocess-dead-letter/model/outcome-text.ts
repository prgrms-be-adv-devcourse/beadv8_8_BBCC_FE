import type { ReprocessOutcome } from '@/entities/dead-letter'

export type OutcomeText = { tone: 'success' | 'error'; text: string }

export function reprocessOutcomeText(outcome: ReprocessOutcome): OutcomeText {
  switch (outcome.kind) {
    case 'REPROCESSED':
      return { tone: 'success', text: '재처리했어요.' }
    case 'ALREADY_REPROCESSED':
      return { tone: 'success', text: '이미 재처리된 메시지예요.' }
    case 'FAILED':
      return {
        tone: 'error',
        text: outcome.failureType
          ? `다시 처리하지 못했어요. 실패 예외: ${outcome.failureType}`
          : '다시 처리하지 못했어요.',
      }
  }
}
