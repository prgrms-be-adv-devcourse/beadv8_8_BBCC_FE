import { ITEM_CANCEL_REASON_LABEL } from '@/entities/order'
import type { CancelSellerOrderRequestDto } from '../api/cancel-seller-order.dto'

/** 판매자가 고를 수 있는 사유 (BE SellerCancelReason). SELLER_UNAVAILABLE은 시스템 정리용이라 없다 */
export type SellerCancelReason = 'OUT_OF_STOCK' | 'WRONG_PRODUCT_INFO' | 'OTHER'

export const SELLER_CANCEL_REASONS: { value: SellerCancelReason; label: string }[] = (
  ['OUT_OF_STOCK', 'WRONG_PRODUCT_INFO', 'OTHER'] as const
).map((value) => ({ value, label: ITEM_CANCEL_REASON_LABEL[value] }))

export const CANCEL_MEMO_MAX = 500

export function validateCancelMemo(memo: string): string | null {
  return memo.trim().length > CANCEL_MEMO_MAX ? `메모는 ${CANCEL_MEMO_MAX}자까지예요.` : null
}

export function toCancelSellerOrderRequest(input: {
  reason: SellerCancelReason
  memo: string
}): CancelSellerOrderRequestDto {
  const memo = input.memo.trim()
  return memo ? { reason: input.reason, memo } : { reason: input.reason }
}
