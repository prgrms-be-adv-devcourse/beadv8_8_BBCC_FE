import type { Settlement, SettlementRunResult } from './settlement'

/** 지급 결과를 받지 못한 정산서(COMPLETED)만 지급을 다시 요청할 수 있다 (BE validatePayoutRetryable) */
export function canRetrySettlementPayout(settlement: Pick<Settlement, 'status'>): boolean {
  return settlement.status === 'COMPLETED'
}

/** 실행 중(RUNNING)으로 남은 실행만 실패로 정리할 수 있다 (BE recover: isRunning, 그 밖은 409) */
export function canRecoverSettlementRun(run: Pick<SettlementRunResult, 'status'>): boolean {
  return run.status === 'RUNNING'
}
