import { formatDateTime, labelOf } from '@/shared/lib'
import type { WishRequest, WishStatus } from './wish'

const TIMELINE_LABEL: Record<string, string> = {
  SENT: '조르기 보냄',
  PAID: '결제 완료',
  REJECTED: '거절',
  CANCELLED: '철회',
  EXPIRED: '기한 지나 만료',
}
export function wishTimelineLabel(step: string): string {
  return TIMELINE_LABEL[step] ?? '진행 중'
}

export function wishTimelineStatusLabel(status: 'DONE' | 'WAITING'): string {
  return { DONE: '완료', WAITING: '대기' }[status]
}

/** 자녀 장바구니 칸을 조르기에 넣을 수 있는지: 판매 중이고 다른 조르기에 예약되지 않음 */
export function canSendWishLine(line: { purchasable: boolean; reserved: boolean }): boolean {
  return line.purchasable && !line.reserved
}

/** 자녀 장바구니 칸을 뺄 수 있는지: 예약된 칸은 빼면 409 (BE CART_ITEM_RESERVED) */
export function canRemoveChildCartLine(line: { reserved: boolean }): boolean {
  return !line.reserved
}

/** 승인(= 결제) · 거절은 대기 중인 조르기에만 */
export function canDecideWish(wish: { status: WishStatus }): boolean {
  return wish.status === 'REQUESTED'
}

const STATUS_LABEL: Record<WishStatus, string> = {
  REQUESTED: '대기',
  PAID: '결제 완료',
  REJECTED: '거절',
  CANCELLED: '철회됨',
  EXPIRED: '기한 지나 만료',
}
export function wishStatusLabel(wish: { status: WishStatus }): string {
  return labelOf(STATUS_LABEL, wish.status)
}

/** 목록에서 조르기를 구분하는 제목: 첫 상품 이름, 여러 개면 'OO 외 N개' */
export function wishTitle(wish: { items: { productName: string }[] }): string {
  const [first, ...rest] = wish.items
  return rest.length ? `${first.productName} 외 ${rest.length}개` : first.productName
}

export function countPendingWishes(wishes: { status: WishStatus }[]): number {
  return wishes.filter(canDecideWish).length
}

/** 결제 완료된 조르기의 줄 결과: 산 수량 또는 제외. 결제 완료 전 · 거절 · 철회면 null */
export function wishLineDecisionLabel(
  wish: { status: WishStatus },
  line: { purchasedQuantity: number },
): string | null {
  if (wish.status !== 'PAID') return null
  return line.purchasedQuantity > 0 ? `${line.purchasedQuantity}개 결제` : '제외'
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

const DAY_MS = 24 * 60 * 60 * 1000

/** 서버 시각(시간대 없는 KST LocalDateTime)을 브라우저 시간대와 상관없이 읽는다 */
function parseKst(value: string): number {
  return Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}+09:00`)
}

/**
 * 조르기 남은 기한 (BE #1008, 기본 7일). 대기: n일 남음 · 하루 미만 오늘 마감 · 지났으면 기한 지남(만료 처리 전),
 * 만료: 만료된 시각(상태 라벨과 함께 보인다). 그 밖(결제 · 거절 · 철회) · 만료 꺼짐은 null
 */
export function wishDeadlineLabel(
  wish: { status: WishStatus; expiresAt: string | null; expiredAt: string | null },
  now: Date = new Date(),
): string | null {
  if (wish.status === 'EXPIRED')
    return wish.expiredAt ? `${formatDateTime(wish.expiredAt)} 만료` : null
  if (wish.status !== 'REQUESTED' || !wish.expiresAt) return null
  const left = parseKst(wish.expiresAt) - now.getTime()
  if (left <= 0) return '기한 지남'
  if (left < DAY_MS) return '오늘 마감'
  return `${Math.floor(left / DAY_MS)}일 남음`
}
