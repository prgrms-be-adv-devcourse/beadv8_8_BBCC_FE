import type { WishOrderResult, WishRequest, WishStatus } from './wish'

const TIMELINE_LABEL: Record<string, string> = {
  SENT: '조르기 보냄',
  APPROVED: '승인',
  REJECTED: '거절',
  CREATED: '주문 접수',
  PAYMENT_REQUESTED: '결제 대기',
  PAID: '결제 완료',
  CANCELLED: '주문 취소',
  SHIPPED: '발송',
  DELIVERED: '배송 완료',
  CONFIRMED: '구매 확정',
}
export function wishTimelineLabel(step: string): string {
  return TIMELINE_LABEL[step] ?? '진행 중'
}

export function wishTimelineStatusLabel(
  status: 'DONE' | 'PARTIAL' | 'WAITING' | 'NOT_APPLICABLE',
): string {
  return { DONE: '완료', PARTIAL: '일부 완료', WAITING: '대기', NOT_APPLICABLE: '해당 없음' }[
    status
  ]
}

export function canSendWishLine(line: { purchasable: boolean; requestId: string | null }): boolean {
  return line.purchasable && line.requestId === null
}

export function canRemoveChildWishLine(line: {
  addedBy: 'CHILD' | 'PARENT'
  requestId: string | null
}): boolean {
  return line.addedBy === 'CHILD' && line.requestId === null
}

export function canDecideWish(wish: { status: WishStatus }): boolean {
  return wish.status === 'REQUESTED'
}

export function wishStatusLabel(wish: {
  status: WishStatus
  orderResult: WishOrderResult
  checkout?: 'ORDER' | 'CART' | null
}): string {
  if (wish.status === 'REQUESTED') return '대기'
  if (wish.status === 'REJECTED') return '거절'
  if (wish.checkout === 'CART') return '승인'
  if (wish.orderResult === 'PAID') return '결제 완료'
  if (wish.orderResult === 'CANCELLED') return '취소됨'
  return '결제 대기'
}

/** 목록에서 조르기를 구분하는 제목: 첫 상품 이름, 여러 개면 'OO 외 N개' */
export function wishTitle(wish: { items: { productName: string }[] }): string {
  const [first, ...rest] = wish.items
  return rest.length ? `${first.productName} 외 ${rest.length}개` : first.productName
}

export function countPendingWishes(wishes: { status: WishStatus }[]): number {
  return wishes.filter(canDecideWish).length
}

/** 승인한 조르기의 줄 결과. 승인 전 · 거절이면 null */
export function wishLineDecisionLabel(
  wish: { status: WishStatus },
  line: { approvedQuantity: number | null },
): string | null {
  if (wish.status !== 'APPROVED') return null
  return line.approvedQuantity === null ? '제외' : `${line.approvedQuantity}개 승인`
}

type WishRejectReason = NonNullable<WishRequest['rejectReason']>

const REJECT_REASON_LABEL: Record<WishRejectReason, string> = {
  TOO_EXPENSIVE: '너무 비싸요',
  ALREADY_HAVE: '이미 있어요',
  NEXT_TIME: '다음에 사자',
  OTHER: '기타',
}
export const WISH_REJECT_REASONS = Object.keys(REJECT_REASON_LABEL) as WishRejectReason[]

export function wishRejectReasonLabel(reason: WishRejectReason): string {
  return REJECT_REASON_LABEL[reason]
}
