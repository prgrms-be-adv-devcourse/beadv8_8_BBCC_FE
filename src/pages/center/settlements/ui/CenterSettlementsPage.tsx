import type { ReactNode } from 'react'
import {
  SettlementItemList,
  sumSettlementItems,
  useSettlementsQuery,
  useSettlementTargetsQuery,
} from '@/entities/settlement'
import { useWalletQuery } from '@/entities/wallet'
import { getErrorMessage } from '@/shared/api'
import { sellerPathsOf } from '@/shared/config'
import { formatWon, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'
import { SettlementTable } from './SettlementTable'

/** 정산: 예치금 잔액 · 정산 예정 금액 한 줄 → 정산 예정(구매확정분) 표 → 정산서 장부. 정산서는 따로인 화면 */
export function CenterSettlementsPage() {
  const targets = useSettlementTargetsQuery()
  const settlements = useSettlementsQuery()
  const wallet = useWalletQuery()
  const sellerPaths = sellerPathsOf(useArea())

  return (
    <div className="shop-look space-y-10">
      <PageHeader
        title="정산"
        step="⑦"
        description="구매확정된 판매 금액에서 수수료를 빼고 예치금으로 입금돼요."
        note="구매확정된 주문상품이 정산 대상으로 쌓이고, 정산이 실행되면 수수료 10%를 뺀 금액이 판매자 예치금으로 입금돼요(지급 완료)."
      />

      {/* 판매자가 가장 먼저 보는 두 수치 */}
      <section
        aria-label="정산 요약"
        className="border-rule divide-rule grid grid-cols-2 divide-x border-y"
      >
        <Figure label="예치금 잔액" pending={wallet.isPending} error={wallet.error}>
          {wallet.data && formatWon(wallet.data.balance)}
        </Figure>
        <Figure
          label="정산 예정 금액"
          hint="수수료 빼기 전"
          pending={targets.isPending}
          error={targets.error}
        >
          {targets.data && formatWon(sumSettlementItems(targets.data.content))}
        </Figure>
      </section>

      <section aria-label="정산 예정" className="space-y-3">
        <h2 className="text-section">
          정산 예정
          {targets.data && (
            <span className="text-ink-3 figure ml-2 text-sm font-medium">
              {targets.data.content.length}건
            </span>
          )}
        </h2>
        <p className="text-ink-3 text-[13px]">아직 정산 안 된 구매확정분이에요.</p>
        {targets.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {targets.isError && (
          <StateMessage tone="error">{getErrorMessage(targets.error)}</StateMessage>
        )}
        {targets.data?.content.length === 0 && <StateMessage>정산 대상이 없어요.</StateMessage>}
        {targets.data && targets.data.content.length > 0 && (
          <SettlementItemList label="정산 예정" items={targets.data.content} isAmountLast />
        )}
      </section>

      <section aria-label="정산서 목록" className="space-y-3">
        <h2 className="text-section">정산서</h2>
        {settlements.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {settlements.isError && (
          <StateMessage tone="error">{getErrorMessage(settlements.error)}</StateMessage>
        )}
        {settlements.data?.content.length === 0 && <StateMessage>정산서가 없어요.</StateMessage>}
        {settlements.data && settlements.data.content.length > 0 && (
          <SettlementTable
            settlements={settlements.data.content}
            detailTo={sellerPaths.settlement}
          />
        )}
      </section>
    </div>
  )
}

type FigureProps = {
  label: string
  /** 이름 옆 작은 설명 */
  hint?: string
  pending: boolean
  error: unknown
  children: ReactNode
}

/** 수치 줄의 칸 하나: 이름 · 큰 수치 (불러오는 중 · 오류는 그 자리에) */
function Figure({ label, hint, pending, error, children }: FigureProps) {
  return (
    <div className="space-y-1 px-4 py-4 first:pl-0 md:px-6 md:py-5 md:first:pl-0">
      <p className="text-ink-3 flex flex-wrap items-baseline gap-x-2 text-[13px]">
        {label}
        {hint && <span className="text-xs">{hint}</span>}
      </p>
      {pending && <StateMessage>불러오는 중…</StateMessage>}
      {Boolean(error) && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
      {!pending && !error && (
        <p className="figure text-ink text-2xl font-bold tracking-tight">{children}</p>
      )}
    </div>
  )
}
