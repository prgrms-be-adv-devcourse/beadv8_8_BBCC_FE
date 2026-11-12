import { RetrySettlementPayoutButton } from '@/features/retry-settlement-payout'
import { SettlementStatusTag, type AdminSettlement } from '@/entities/settlement'
import { cn, formatDateTime, formatWon } from '@/shared/lib'

type AdminSettlementTableProps = { settlements: AdminSettlement[] }

const HEAD = 'py-2 pr-4 font-medium whitespace-nowrap last:pr-0'
const CELL = 'py-3 pr-4 align-top last:pr-0'

/** 모든 판매자의 정산서: 기간 · 판매자 · 지급액 · 상태(실패 사유) · 입금 시각, 지급 결과를 못 받은 정산서는 「지급 재요청」 */
export function AdminSettlementTable({ settlements }: AdminSettlementTableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-label="정산서" className="w-full text-sm">
        <thead>
          <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
            <th scope="col" className={HEAD}>
              기간
            </th>
            <th scope="col" className={HEAD}>
              판매자
            </th>
            <th scope="col" className={cn(HEAD, 'text-right')}>
              지급액
            </th>
            <th scope="col" className={HEAD}>
              상태
            </th>
            <th scope="col" className={HEAD}>
              입금 시각
            </th>
            <th scope="col" className={HEAD}>
              <span className="sr-only">지급 재요청</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-rule border-rule divide-y border-b">
          {settlements.map((settlement) => (
            <tr key={settlement.id}>
              <td className={CELL}>
                <span className="figure text-ink block font-semibold whitespace-nowrap">
                  {settlement.periodStart} ~ {settlement.periodEnd}
                </span>
                <span className="text-ink-3 figure block text-xs">정산서 #{settlement.id}</span>
              </td>
              <td className={cn(CELL, 'figure whitespace-nowrap')}>#{settlement.sellerId}</td>
              <td className={cn(CELL, 'figure text-right font-bold whitespace-nowrap')}>
                {formatWon(settlement.payoutAmount)}
              </td>
              <td className={CELL}>
                <SettlementStatusTag status={settlement.status} />
                {settlement.failReason && (
                  <span className="text-destructive mt-1 block text-xs break-all">
                    {settlement.failReason}
                  </span>
                )}
              </td>
              <td className={cn(CELL, 'figure text-ink-2 whitespace-nowrap')}>
                {formatDateTime(settlement.paidAt)}
              </td>
              <td className={CELL}>
                <RetrySettlementPayoutButton settlement={settlement} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
