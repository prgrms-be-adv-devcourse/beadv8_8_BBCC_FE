import { Link } from 'react-router'
import type { ReviewAction } from '@/entities/review'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'

type OrderItemReviewActionProps = {
  action: ReviewAction
  orderItemId: string
  /** 준비 중이면 작성 가능 목록을 다시 확인한다 */
  onRecheck: () => void
  isRechecking: boolean
}

/** 구매확정한 주문상품 줄의 리뷰 동작: 쓰기 · 작성 완료 · 준비 중(다시 확인) */
export function OrderItemReviewAction({
  action,
  orderItemId,
  onRecheck,
  isRechecking,
}: OrderItemReviewActionProps) {
  if (action === 'write')
    return (
      <Link to={paths.shop.reviewWrite(orderItemId)} className="shop-btn h-9 px-4 text-sm">
        리뷰 쓰기
      </Link>
    )
  if (action === 'written')
    return (
      <Link to={paths.shop.reviews} className="shop-link text-sm">
        리뷰 작성 완료
      </Link>
    )
  return (
    <span className="text-ink-3 flex items-center gap-2 text-[13px]">
      리뷰 준비 중
      <Button size="sm" variant="outline" disabled={isRechecking} onClick={onRecheck}>
        다시 확인
      </Button>
    </span>
  )
}
