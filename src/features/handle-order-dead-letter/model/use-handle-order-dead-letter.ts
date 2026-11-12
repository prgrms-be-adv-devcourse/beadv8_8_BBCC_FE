import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  deadLetterKeys,
  orderDeadLetterApi,
  orderDeadLetterOutcomeOf,
  toOrderDeadLetter,
  type OrderDeadLetter,
  type ReprocessOutcome,
} from '@/entities/dead-letter'
import { runWithAction } from '@/shared/api'

export type OrderDeadLetterNotice = { tone: 'success' | 'error'; text: string }

export function reprocessNotice(outcome: ReprocessOutcome): OrderDeadLetterNotice {
  switch (outcome.kind) {
    case 'REPROCESSED':
      return { tone: 'success', text: '재처리했어요.' }
    case 'ALREADY_REPROCESSED':
      return { tone: 'success', text: '이미 재처리된 메시지예요.' }
    case 'FAILED':
      return {
        tone: 'error',
        text: outcome.failureType
          ? `다시 처리하지 못했어요. 이유: ${outcome.failureType}`
          : '다시 처리하지 못했어요.',
      }
  }
}

/** 재처리 · 확인 후 종료. 성공 · 실패 모두 목록 · 상세를 다시 받는다 (409면 그사이 상태가 바뀐 것) */
export function useHandleOrderDeadLetter(deadLetter: OrderDeadLetter) {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: deadLetterKeys.all })
  const reprocess = useMutation({
    mutationFn: () =>
      runWithAction('주문 처리 실패 메시지 재처리', async () => {
        const result = toOrderDeadLetter(await orderDeadLetterApi.reprocess(deadLetter.id))
        return reprocessNotice(orderDeadLetterOutcomeOf(deadLetter.reprocessCount, result))
      }),
    onSettled: refresh,
  })
  const close = useMutation({
    mutationFn: (memo: string) =>
      runWithAction('주문 처리 실패 메시지 확인 후 종료', () =>
        orderDeadLetterApi.close(deadLetter.id, memo.trim()),
      ),
    onSettled: refresh,
  })
  return { reprocess, close }
}
