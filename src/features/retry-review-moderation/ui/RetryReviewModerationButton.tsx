import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useRetryReviewModeration } from '../model/use-retry-review-moderation'

/** 「다시 돌리기」: 자동 검사를 여러 번 판단하지 못해 멈춘 리뷰를 다시 검사 대기로 돌린다 (확인 창 한 번) */
export function RetryReviewModerationButton() {
  const retry = useRetryReviewModeration()
  const handleClick = async () => {
    if (
      await confirmAction({
        title: '멈춘 리뷰를 다시 검사 대기로 돌릴까요?',
        description:
          '자동 검사를 여러 번 판단하지 못한 리뷰를 다시 검사해요. 여러 번 눌러도 괜찮아요.',
        confirmLabel: '다시 돌리기',
      })
    )
      retry.mutate()
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" disabled={retry.isPending} onClick={handleClick}>
        다시 돌리기
      </Button>
      {retry.isError && <StateMessage tone="error">{getErrorMessage(retry.error)}</StateMessage>}
    </div>
  )
}
