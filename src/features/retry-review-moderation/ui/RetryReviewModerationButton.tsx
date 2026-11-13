import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useRetryReviewModeration } from '../model/use-retry-review-moderation'

/** 「다시 검사」: 자동 검사를 여러 번 판단하지 못해 멈춘 리뷰를 다시 검사 대기로 돌린다 */
export function RetryReviewModerationButton() {
  const retry = useRetryReviewModeration()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" disabled={retry.isPending} onClick={() => retry.mutate()}>
        다시 검사
      </Button>
      {retry.isError && <StateMessage tone="error">{getErrorMessage(retry.error)}</StateMessage>}
    </div>
  )
}
