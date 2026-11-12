import { cn, formatDateTime, formatWon } from '@/shared/lib'
import type { SettlementItem, SettlementTarget } from '../model/settlement'
import { expectedPayoutLabel } from '../model/settlement.rules'

/**
 * 정산서 항목: 금액 · 구매확정 시각 순서.
 * 정산 예정(isTarget): 구매확정 시각 · 정산 예정일 · 금액 순서 (금액을 맨 끝 칸에)
 */
type SettlementItemListProps = {
  /** 표 이름 (예: 정산 예정) */
  label: string
} & ({ isTarget?: false; items: SettlementItem[] } | { isTarget: true; items: SettlementTarget[] })

type NarrowOnlyProps = { children: string }

/** 좁은 화면에서만 보이는 머리 말 · 이음 점 (넓은 화면은 표 머리가 대신한다) */
function NarrowOnly({ children }: NarrowOnlyProps) {
  return <span className="lg:hidden">{children}</span>
}

const HEAD = 'py-2 pr-4 font-medium last:pr-0'
const CELL = 'lg:py-3 lg:pr-4 lg:last:pr-0'

/**
 * 구매확정 주문상품 표 (BE 응답에 상품명이 없어 주문 · 주문상품 번호로).
 * 넓은 화면은 칸으로, 좁은 화면은 행마다 「주문 #1 · 주문상품 #2 · …」 한 줄로 다시 쌓는다
 */
export function SettlementItemList(props: SettlementItemListProps) {
  const { label, items, isTarget = false } = props
  const payoutLabels = props.isTarget
    ? props.items.map((item) => expectedPayoutLabel(item.expectedPayoutOn))
    : null
  const amountHead = (
    <th key="amount" scope="col" className={cn(HEAD, 'lg:text-right')}>
      금액
    </th>
  )
  const confirmedHead = (
    <th key="confirmed" scope="col" className={HEAD}>
      구매확정 시각
    </th>
  )
  const payoutHead = (
    <th key="payout" scope="col" className={HEAD}>
      정산 예정일
    </th>
  )

  return (
    <table aria-label={label} className="w-full text-sm max-lg:block">
      <thead className="max-lg:sr-only">
        <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
          <th scope="col" className={HEAD}>
            주문
          </th>
          <th scope="col" className={HEAD}>
            주문상품
          </th>
          {isTarget ? [confirmedHead, payoutHead, amountHead] : [amountHead, confirmedHead]}
        </tr>
      </thead>
      <tbody className="divide-rule border-rule divide-y border-b max-lg:block max-lg:border-t">
        {items.map((item, index) => {
          const amount = (
            <td
              key="amount"
              className={cn(CELL, 'figure font-bold lg:text-right', isTarget && 'max-lg:ml-auto')}
            >
              {!isTarget && <NarrowOnly>{' · '}</NarrowOnly>}
              {formatWon(item.amount)}
            </td>
          )
          const confirmed = (
            <td key="confirmed" className={cn(CELL, 'text-ink-3 figure')}>
              <NarrowOnly>{' · 구매확정 '}</NarrowOnly>
              {formatDateTime(item.confirmedAt)}
            </td>
          )
          const payout = payoutLabels && (
            <td key="payout" className={cn(CELL, 'text-ink-2 figure')}>
              <NarrowOnly>{' · 정산 예정 '}</NarrowOnly>
              {payoutLabels[index]}
            </td>
          )
          return (
            <tr
              key={item.orderItemId}
              className="max-lg:flex max-lg:flex-wrap max-lg:items-baseline max-lg:gap-x-1 max-lg:py-3"
            >
              <td className={cn(CELL, 'figure font-semibold')}>
                <NarrowOnly>{'주문 '}</NarrowOnly>#{item.orderId}
              </td>
              <td className={cn(CELL, 'figure')}>
                <NarrowOnly>{' · 주문상품 '}</NarrowOnly>#{item.orderItemId}
              </td>
              {isTarget ? [confirmed, payout, amount] : [amount, confirmed]}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
