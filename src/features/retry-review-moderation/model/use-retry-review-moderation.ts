import { useMutation, useQueryClient } from '@tanstack/react-query'
import { retryExhaustedMessage, reviewKeys } from '@/entities/review'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { retryReviewModerationApi } from '../api/retry-review-moderation-api'

/** 상한에 걸린 리뷰 다시 검사. 끝나면 결과 건수를 알리고 리뷰 목록을 다시 부른다 */
export function useRetryReviewModeration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      runWithAction('리뷰 다시 검사', () => retryReviewModerationApi.retryExhausted()),
    onSuccess: ({ resetCount }) => {
      toast(retryExhaustedMessage(resetCount))
      return queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    },
  })
}
