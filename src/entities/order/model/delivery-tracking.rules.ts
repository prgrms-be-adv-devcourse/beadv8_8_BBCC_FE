import { getErrorMessage, getErrorStatus } from '@/shared/api'
import type { OrderDelivery } from './order'

/** 택배 조회(Delivery Tracker) 상태 코드 → 이름. 모르는 코드는 그대로 보인다 */
const TRACKING_STATUS_LABEL: Record<string, string> = {
  UNKNOWN: '확인 중',
  INFORMATION_RECEIVED: '접수',
  AT_PICKUP: '집화',
  IN_TRANSIT: '이동 중',
  OUT_FOR_DELIVERY: '배송 출발',
  ATTEMPT_FAIL: '배송 실패',
  DELIVERED: '배송 완료',
  AVAILABLE_FOR_PICKUP: '수령 대기',
  EXCEPTION: '배송 문제',
}

export function trackingStatusLabel(status: string): string {
  return TRACKING_STATUS_LABEL[status] ?? status
}

/** 운송장이 있는 발송 이후 배송만 조회한다 (발송 전은 BE 409) */
export function canTrackDelivery(delivery: OrderDelivery): boolean {
  return (
    delivery.trackingNumber !== null &&
    (delivery.status === 'SHIPPING' || delivery.status === 'DELIVERED')
  )
}

export const TRACKING_UNAVAILABLE_MESSAGE =
  '지금 택배 조회를 할 수 없어요. 잠시 후 다시 시도해 주세요'

/** 404 · 409는 서버 문구 그대로, 503(택배 조회 꺼짐 · 외부 실패 · 서킷 열림)은 정한 문구와 다시 시도 */
export function trackingErrorOf(error: unknown): { message: string; canRetry: boolean } {
  if (getErrorStatus(error) === 503)
    return { message: TRACKING_UNAVAILABLE_MESSAGE, canRetry: true }
  return { message: getErrorMessage(error), canRetry: false }
}

/** 입을 아이 이름: 주문에 담긴 이름 → 내 자녀 목록의 이름 → 「#번호」 */
export function childNameOf(
  child: { id: string; name: string | null },
  namesById: Readonly<Record<string, string>>,
): string {
  return child.name ?? namesById[child.id] ?? `#${child.id}`
}
