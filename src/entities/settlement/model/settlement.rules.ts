import type { Settlement } from './settlement'

/** 실패 정산 재처리는 판매자 지갑 적립에 실패한 정산만 (기획서 8장 보완) */
export function canRetrySettlement(settlement: Settlement): boolean {
  return settlement.status === 'FAILED'
}
