import { ORDER_STATUS_LABEL, type OrderStatus } from '../model/order'
import { labelOf } from '@/shared/lib'

type OrderStatusTagProps = { status: OrderStatus }

/** 주문 상태 꼬리표 (관리자 표 · 상세): 회색 글자. 취소 이유는 따로 보여 준다 */
export function OrderStatusTag({ status }: OrderStatusTagProps) {
  return (
    <span className="bg-paper-2 text-ink-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap">
      {labelOf(ORDER_STATUS_LABEL, status)}
    </span>
  )
}
