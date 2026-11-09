import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { reviewKeys, toReview, type Review, type ReviewDraft } from '@/entities/review'
import { getErrorStatus, runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { writeReviewApi } from '../api/write-review-api'
import { toWriteReviewRequest } from './write-review.mapper'

type UseWriteReviewOptions = { onWritten?: (review: Review) => void }

/**
 * 리뷰 쓰기. 성공하면 작성 가능 목록 · 내 리뷰 · 그 상품의 리뷰 · 요약을 다시 부른다.
 * 409(이미 씀)면 목록을 다시 불러와 「작성 완료」로 보이게 한다 (자동 재요청 없음)
 */
export function useWriteReview(orderItemId: string, { onWritten }: UseWriteReviewOptions = {}) {
  const queryClient = useQueryClient()
  // 두 번 빠르게 누르면 다시 그리기 전에 두 번째 클릭이 올 수 있어 상태 대신 ref로 막는다
  const inFlight = useRef(false)
  const mutation = useMutation({
    mutationFn: (draft: ReviewDraft) =>
      runWithAction('리뷰 쓰기', () =>
        writeReviewApi.write(toWriteReviewRequest(orderItemId, draft)),
      ).then(toReview),
    onSuccess: (review) => {
      toast('리뷰를 남겼어요')
      onWritten?.(review)
      return queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    },
    onError: (error) => {
      if (getErrorStatus(error) === 409)
        void queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    },
    onSettled: () => {
      inFlight.current = false
    },
  })
  return {
    ...mutation,
    /** 요청 중 다시 누르면 무시한다 (버튼 비활성화와 같이) */
    write: (draft: ReviewDraft) => {
      if (inFlight.current) return
      inFlight.current = true
      mutation.mutate(draft)
    },
    isAlreadyWritten: getErrorStatus(mutation.error) === 409,
  }
}
