import { Link, Navigate, useLocation } from 'react-router'
import {
  isAwaitingPayment,
  useChargeHistoryQuery,
  useWalletQuery,
  useWalletTransactionsQuery,
  WalletTransactionList,
} from '@/entities/wallet'
import { AbandonChargeButton } from '@/features/charge-wallet'
import { getErrorMessage } from '@/shared/api'
import { walletPathsOf } from '@/shared/config'
import { formatDateTime, formatWon, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 예치금 화면의 최근 이용 내역 건수 */
const RECENT_COUNT = 5

/** 예치금: 잔액 카드(이용 내역 · 충전하기) · 최근 이용 내역. 충전 · 전체 내역은 따로인 화면 */
export function ShopWalletPage() {
  const wallet = useWalletQuery()
  const walletPaths = walletPathsOf(useArea())
  const charges = useChargeHistoryQuery()
  const transactions = useWalletTransactionsQuery()
  const location = useLocation()
  // 결제창에서 돌아오지 않은 충전 (예: 간편결제 앱에서 잔액을 충전하다 결제가 끝나지 않음)
  const now = new Date()
  const awaiting = charges.data?.filter((charge) => isAwaitingPayment(charge, now)) ?? []

  // 주문서 「충전하고 돌아오기」(?amount=&return=)는 충전 화면으로 그대로 넘긴다
  if (location.search.includes('amount=') || location.search.includes('return=')) {
    return <Navigate to={`${walletPaths.charge}${location.search}`} replace />
  }

  return (
    <div className="shop-look max-w-2xl space-y-8">
      <PageHeader
        title="예치금"
        step="④"
        description="주문은 예치금으로 결제돼요. 토스 테스트 결제로 충전해요."
        note="충전은 토스 테스트 결제로 하고, 돌아오면 서버가 토스에 승인을 요청해요. 충전 취소는 토스 결제 취소예요."
      />

      {/* 잔액 카드: 잔액 · 이용 내역 | 충전하기 · 충전 내역 줄 */}
      <section aria-label="예치금 잔액" className="border-rule rounded-xl border">
        <div className="space-y-4 p-5 md:p-6">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-[13px] font-bold">
              <span
                aria-hidden
                className="bg-signal text-signal-ink flex size-5 items-center justify-center rounded-full text-[11px]"
              >
                K
              </span>
              Kidly 예치금
            </p>
            {wallet.isPending && <StateMessage>불러오는 중…</StateMessage>}
            {wallet.isError && (
              <StateMessage tone="error">{getErrorMessage(wallet.error)}</StateMessage>
            )}
            {wallet.data && (
              <p className="figure text-ink text-[30px] font-bold tracking-tight">
                {formatWon(wallet.data.balance)}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={walletPaths.history}
              className="border-field-edge text-ink hover:bg-paper-2 flex h-12 items-center justify-center rounded-md border text-sm font-semibold transition-colors"
            >
              이용 내역
            </Link>
            <Link
              to={walletPaths.charge}
              className="bg-signal text-signal-ink hover:bg-signal-deep flex h-12 items-center justify-center rounded-md text-sm font-bold transition-colors active:translate-y-px"
            >
              충전하기
            </Link>
          </div>
        </div>
        <Link
          to={`${walletPaths.history}?tab=charges`}
          className="border-rule text-ink-2 hover:bg-paper-2 flex items-center justify-between border-t px-5 py-3.5 text-[13px] transition-colors md:px-6"
        >
          충전 내역
          <svg
            viewBox="0 0 24 24"
            className="text-ink-3 size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </Link>
      </section>

      {awaiting.length > 0 && (
        <section
          aria-label="끝나지 않은 충전"
          className="border-rule space-y-2 rounded-lg border p-4 md:p-5"
        >
          <h2 className="text-[15px] font-bold">결제가 끝나지 않은 충전이 있어요</h2>
          <p className="text-ink-3 text-xs">
            결제창에서 결제를 마치지 못했어요. 잔액은 바뀌지 않았고, 시간이 지나면 자동으로 끝나요.
            다시 충전하려면 충전하기에서 새로 요청해 주세요.
          </p>
          {awaiting.map((charge) => (
            <div
              key={charge.id}
              className="border-rule flex items-center justify-between border-t pt-2 text-sm"
            >
              <span>
                <span className="figure font-semibold">{formatWon(charge.amount)}</span>{' '}
                <span className="text-ink-3 figure">
                  {formatDateTime(charge.expiresAt)}에 자동으로 끝나요
                </span>
              </span>
              <AbandonChargeButton tossOrderId={charge.tossOrderId} />
            </div>
          ))}
        </section>
      )}

      {/* 최근 이용 내역 다섯 건만. 나머지 · 충전 내역은 이용 내역 화면에서 */}
      <section aria-label="최근 이용 내역" className="space-y-2">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-[15px] font-bold">최근 이용 내역</h2>
          <Link
            to={walletPaths.history}
            className="text-ink-3 hover:text-ink text-[13px] font-semibold"
          >
            전체 보기
          </Link>
        </div>
        {transactions.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {transactions.isError && (
          <StateMessage tone="error">{getErrorMessage(transactions.error)}</StateMessage>
        )}
        {transactions.data?.length === 0 && <StateMessage>거래가 없어요.</StateMessage>}
        {transactions.data && transactions.data.length > 0 && (
          <WalletTransactionList transactions={transactions.data.slice(0, RECENT_COUNT)} />
        )}
      </section>
    </div>
  )
}
