import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  deadLetterApi,
  deadLetterKeys,
  reprocessOutcomeOf,
  toDeadLetter,
  type DeadLetter,
  type DeadLetterModule,
} from '@/entities/dead-letter'
import { runWithAction } from '@/shared/api'

/** 처리기가 다시 실패해도 응답은 200이라, 결과(성공 · 실패 · 이미 처리됨)는 응답 내용으로 고른다 */
export function useReprocessDeadLetter(module: DeadLetterModule) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (deadLetter: DeadLetter) =>
      runWithAction('처리 실패 메시지 재처리', async () => {
        const result = toDeadLetter(await deadLetterApi.reprocess(module, deadLetter.id))
        return reprocessOutcomeOf(deadLetter.replayCount, result)
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deadLetterKeys.all }),
  })
}
