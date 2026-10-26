import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { SettlementStatusTag, type Settlement } from '@/entities/settlement'
import { cn, formatDateTime, formatWon } from '@/shared/lib'

type SettlementTableProps = {
  settlements: Settlement[]
  /** 정산서 상세 주소 (영역마다 다르다) */
  detailTo: (settlementId: string) => string
}

type CellLabelProps = { children: ReactNode }

/** 좁은 화면에서 칸 위에 붙는 이름 (넓은 화면은 표 머리가 대신한다) */
function CellLabel({ children }: CellLabelProps) {
  return <span className="text-ink-3 block text-xs lg:hidden">{children}</span>
}

const HEAD = 'py-2 pr-4 font-medium whitespace-nowrap last:pr-0'
const CELL = 'lg:py-3 lg:pr-4 lg:last:pr-0'

/** 정산서 장부: 기간 · 판매 금액 · 수수료(율) · 지급액 · 상태 · 입금 시각, 「상세」로 정산서 화면 */
export function SettlementTable({ settlements, detailTo }: SettlementTableProps) {
  return (
    <table aria-label="정산서" className="w-full text-sm max-lg:block">
      <thead className="max-lg:sr-only">
        <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
          <th scope="col" className={HEAD}>
            기간
          </th>
          <th scope="col" className={cn(HEAD, 'text-right')}>
            판매 금액
          </th>
          <th scope="col" className={cn(HEAD, 'text-right')}>
            수수료
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
            <span className="sr-only">정산서 보기</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-rule border-rule divide-y border-b max-lg:block max-lg:border-t">
        {settlements.map((settlement) => (
          <tr
            key={settlement.id}
            className="max-lg:grid max-lg:grid-cols-2 max-lg:gap-x-4 max-lg:gap-y-3 max-lg:py-4"
          >
            <td className={cn(CELL, 'align-top')}>
              <span className="figure text-ink block font-semibold whitespace-nowrap">
                {settlement.periodStart} ~ {settlement.periodEnd}
              </span>
              <span className="text-ink-3 figure block text-xs">정산서 #{settlement.id}</span>
            </td>
            <td className={cn(CELL, 'figure lg:text-right')}>
              <CellLabel>판매 금액</CellLabel> {formatWon(settlement.totalAmount)}
            </td>
            <td className={cn(CELL, 'figure lg:text-right')}>
              <CellLabel>수수료</CellLabel> {formatWon(settlement.feeAmount)}{' '}
              <span className="text-ink-3">({settlement.feeRatePercent}%)</span>
            </td>
            <td className={cn(CELL, 'figure font-bold lg:text-right')}>
              <CellLabel>지급</CellLabel> {formatWon(settlement.payoutAmount)}
            </td>
            <td className={CELL}>
              <CellLabel>상태</CellLabel> <SettlementStatusTag status={settlement.status} />
            </td>
            <td className={cn(CELL, 'figure text-ink-2 whitespace-nowrap')}>
              <CellLabel>입금 시각</CellLabel> {formatDateTime(settlement.paidAt)}
            </td>
            <td className={cn(CELL, 'max-lg:col-start-2 max-lg:row-start-1 max-lg:text-right')}>
              <Link
                to={detailTo(settlement.id)}
                className="text-ink-2 hover:text-ink inline-flex min-h-11 items-center text-[13px] font-semibold underline underline-offset-4 transition-colors lg:min-h-8"
              >
                상세
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
