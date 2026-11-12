import { DELIVERY_STATUS_LABEL } from '@/shared/config'
import { labelOf } from '@/shared/lib'
import type { OrderStatusHistoryDto } from '../api/order.dto'
import {
  CANCEL_REASON_LABEL,
  ITEM_CANCEL_REASON_LABEL,
  ITEM_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from './order'

/** 관리자 주문 상태 이력 한 줄 (화면용). 코드는 한글로 바꾸고, 모르는 값은 그대로 보여 준다 */
export type OrderHistoryEntry = {
  id: string
  targetType: string
  target: string
  targetId: string
  from: string | null
  to: string
  toCode: string
  reason: string | null
  actor: string
  source: string
  occurredAt: string
}

const TARGET_LABEL: Record<string, string> = {
  ORDER: '주문',
  ORDER_ITEM: '주문상품',
  DELIVERY: '배송',
  PAYMENT_RECOVERY: '결제 복구',
}

const RECOVERY_STATUS_LABEL: Record<string, string> = {
  PENDING: '복구 대기',
  RECOVERED: '복구됨',
  CANCELLED: '복구 취소',
  NOT_RETRYABLE: '복구 불가',
}

const STATUS_LABEL_BY_TARGET: Record<string, Readonly<Record<string, string>>> = {
  ORDER: ORDER_STATUS_LABEL,
  ORDER_ITEM: ITEM_STATUS_LABEL,
  DELIVERY: DELIVERY_STATUS_LABEL,
  PAYMENT_RECOVERY: RECOVERY_STATUS_LABEL,
}

const ACTOR_LABEL: Record<string, string> = {
  BUYER: '구매자',
  SELLER: '판매자',
  ADMIN: '관리자',
  SYSTEM: '시스템',
  EVENT: '서버 이벤트',
}

/** 바뀐 곳 (BE OrderActor · DeliveryService 출처 상수) */
const SOURCE_LABEL: Record<string, string> = {
  'POST /api/v1/orders': '주문하기',
  'POST /api/v1/orders/{orderId}/cancel': '구매자 취소',
  'POST /api/v1/orders/{orderId}/items/{orderItemId}/confirm': '구매확정',
  'POST /api/v1/admin/orders/recoveries/{id}/retry': '결제 복구 재시도',
  'POST /api/v1/admin/orders/recoveries/{id}/cancel': '결제 복구 취소',
  'POST /api/v1/admin/orders/event-failures/{id}/retry': '처리 실패 재시도',
  'POST /api/v1/seller/orders/{sellerOrderId}/ship': '판매자 발송',
  'POST /api/v1/seller/orders/{sellerOrderId}/deliver': '배송 완료 처리',
  'POST /api/v1/seller/orders/{sellerOrderId}/cancel': '판매자 취소',
  'scheduler:payment-expiry': '결제 마감 자동 취소',
  'scheduler:auto-confirm': '자동 구매확정',
  'payment.completed': '결제 완료 알림',
  'payment.failed': '결제 실패 알림',
  'stock.deduction-failed': '재고 차감 실패 알림',
  'member.withdrawn': '회원 탈퇴 알림',
  'seller.changed': '판매자 정보 변경 알림',
}

const REASON_LABEL: Record<string, string> = { ...ITEM_CANCEL_REASON_LABEL, ...CANCEL_REASON_LABEL }

export function toOrderHistory(dto: OrderStatusHistoryDto): OrderHistoryEntry {
  const statusTable = STATUS_LABEL_BY_TARGET[dto.targetType] ?? {}
  const actorName = labelOf(ACTOR_LABEL, dto.actorType)
  const hasMember = dto.actorId && ['BUYER', 'SELLER', 'ADMIN'].includes(dto.actorType)
  return {
    id: dto.historyId,
    targetType: dto.targetType,
    target: labelOf(TARGET_LABEL, dto.targetType),
    targetId: dto.targetId,
    from: dto.fromStatus ? labelOf(statusTable, dto.fromStatus) : null,
    to: labelOf(statusTable, dto.toStatus),
    toCode: dto.toStatus,
    reason: dto.reason ? labelOf(REASON_LABEL, dto.reason) : null,
    actor: hasMember ? `${actorName} (회원 ${dto.actorId})` : actorName,
    source: labelOf(SOURCE_LABEL, dto.source),
    occurredAt: dto.occurredAt,
  }
}

/** 지금 주문 상태: 주문 대상 이력 중 마지막 상태 (목록 밖 주문의 제목용). 없으면 null */
export function currentOrderStatusOf(history: readonly OrderHistoryEntry[]): OrderStatus | null {
  const last = history.findLast((entry) => entry.targetType === 'ORDER')
  return last && Object.hasOwn(ORDER_STATUS_LABEL, last.toCode)
    ? (last.toCode as OrderStatus)
    : null
}

/** 지금 취소 사유: 마지막 주문 이력이 취소일 때만 그 사유 (한글). 아니면 null */
export function currentCancelReasonOf(history: readonly OrderHistoryEntry[]): string | null {
  const last = history.findLast((entry) => entry.targetType === 'ORDER')
  return last?.toCode === 'CANCELLED' ? last.reason : null
}
