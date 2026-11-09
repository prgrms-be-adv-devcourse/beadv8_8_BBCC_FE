import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewKeys, type Review, type ReviewDraft } from '@/entities/review'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { editReviewApi } from '../api/edit-review-api'
import { toUpdateReviewRequest } from './edit-review.mapper'

/** 내 리뷰 고치기 · 지우기. 끝나면 리뷰 목록 · 요약 · 작성 가능 목록을 다시 부른다 */
export function useEditReview(review: Review, { onSaved }: { onSaved?: () => void } = {}) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: reviewKeys.all })
  const update = useMutation({
    mutationFn: (draft: ReviewDraft) => {
      const request = toUpdateReviewRequest(review, draft)
      // 바뀐 것이 없으면 부르지 않는다 (BE 400 NO_FIELDS_TO_UPDATE)
      if (!request) return Promise.resolve(null)
      return runWithAction('리뷰 고치기', () => editReviewApi.update(review.id, request))
    },
    onSuccess: (result) => {
      if (result) toast('리뷰를 고쳤어요')
      onSaved?.()
      return refresh()
    },
  })
  const remove = useMutation({
    mutationFn: () => runWithAction('리뷰 지우기', () => editReviewApi.remove(review.id)),
    onSuccess: () => {
      toast('리뷰를 지웠어요')
      return refresh()
    },
  })
  return { update, remove }
}
