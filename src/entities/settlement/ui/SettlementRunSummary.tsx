import type { ReactNode } from 'react'
import {
  SETTLEMENT_RUN_STATUS_LABEL,
  SKIPPED_PHASE_LABEL,
  type SettlementRunResult,
} from '../model/settlement'

type SettlementRunSummaryProps = { run: SettlementRunResult; action?: ReactNode }

/** 정산 실행 결과 한 줄 + 건너뛴 판매자와 사유. action은 실행 복구 같은 버튼 자리 */
export function SettlementRunSummary({ run, action }: SettlementRunSummaryProps) {
  return (
    <div role="status" className="bg-paper-2 text-ink space-y-2 rounded-lg px-5 py-4 text-sm">
      <p className="figure">
        정산 {SETTLEMENT_RUN_STATUS_LABEL[run.status] ?? run.status} · 성공 {run.successCount} ·
        실패 {run.failCount} · 기간 {run.periodStart} ~ {run.periodEnd}
      </p>
      {run.skippedSellers.length > 0 && (
        <ul aria-label="건너뛴 판매자" className="text-destructive space-y-1 break-all">
          {run.skippedSellers.map((seller) => (
            <li key={seller.sellerId}>
              판매자 #{seller.sellerId} ({SKIPPED_PHASE_LABEL[seller.phase] ?? seller.phase} 중
              건너뜀): {seller.reason}
            </li>
          ))}
        </ul>
      )}
      {action}
    </div>
  )
}
