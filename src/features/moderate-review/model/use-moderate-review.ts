import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MODERATION_ACTION_LABEL, reviewKeys, type ModerationAction } from '@/entities/review'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { moderateReviewApi } from '../api/moderate-review-api'

/** 숨김 확정 · 다시 공개. 끝나면 리뷰 목록(관리자 · 상품 · 요약)을 다시 부른다 */
export function useModerateReview(reviewId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: ModerationAction) =>
      runWithAction(`리뷰 ${MODERATION_ACTION_LABEL[action]}`, () =>
        moderateReviewApi.changeVisibility(reviewId, { visibility: action }),
      ),
    onSuccess: (_, action) => {
      toast(`리뷰를 ${MODERATION_ACTION_LABEL[action]}했어요`)
      return queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    },
  })
}
