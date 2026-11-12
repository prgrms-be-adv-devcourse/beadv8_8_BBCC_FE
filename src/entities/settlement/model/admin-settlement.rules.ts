import type { Settlement } from './settlement'

/** 지급 결과를 받지 못한 정산서(COMPLETED)만 지급을 다시 요청할 수 있다 (BE validatePayoutRetryable) */
export function canRetrySettlementPayout(settlement: Pick<Settlement, 'status'>): boolean {
  return settlement.status === 'COMPLETED'
}
