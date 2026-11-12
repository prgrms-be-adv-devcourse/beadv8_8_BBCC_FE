import {
  MODERATION_ACTION_LABEL,
  moderationActionsOf,
  type ModerationStatus,
} from '@/entities/review'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useModerateReview } from '../model/use-moderate-review'

type ModerateReviewButtonsProps = { reviewId: string; status: ModerationStatus }

const CONFIRM = {
  HIDDEN: {
    title: '이 리뷰를 숨김 확정할까요?',
    description: '상품 리뷰 · 리뷰 요약에서 빠지고, 작성자에게는 검토 중으로 보여요.',
  },
  VISIBLE: {
    title: '이 리뷰를 다시 공개할까요?',
    description: '상품 리뷰 · 리뷰 요약에 다시 보여요.',
  },
} as const

/** 상태에 맞는 조치 버튼(숨김 확정 · 다시 공개). 누르면 확인 창 → PATCH visibility */
export function ModerateReviewButtons({ reviewId, status }: ModerateReviewButtonsProps) {
  const moderate = useModerateReview(reviewId)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {moderationActionsOf(status).map((action) => (
          <Button
            key={action}
            size="sm"
            variant={action === 'HIDDEN' ? 'destructive' : 'outline'}
            disabled={moderate.isPending}
            onClick={async () => {
              if (
                await confirmAction({
                  ...CONFIRM[action],
                  confirmLabel: MODERATION_ACTION_LABEL[action],
                })
              )
                moderate.mutate(action)
            }}
          >
            {MODERATION_ACTION_LABEL[action]}
          </Button>
        ))}
      </div>
      {moderate.isError && (
        <StateMessage tone="error">{getErrorMessage(moderate.error)}</StateMessage>
      )}
    </div>
  )
}
