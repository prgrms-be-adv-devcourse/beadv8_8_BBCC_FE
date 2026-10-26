import { Link, useSearchParams } from 'react-router'
import {
  canCancelCharge,
  ChargeRow,
  useChargeHistoryQuery,
  useWalletTransactionsQuery,
  WalletTransactionList,
} from '@/entities/wallet'
import { CancelChargeButton } from '@/features/cancel-charge'
import { getErrorMessage } from '@/shared/api'
import { walletPathsOf } from '@/shared/config'
import { cn, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

const TABS = [
  { value: 'all', label: '이용 내역' },
  { value: 'charges', label: '충전 내역' },
] as const
type Tab = (typeof TABS)[number]['value']

/**
 * 예치금 이용 내역 (예치금 화면과 따로): 탭 둘.
 * 이용 내역은 입출금 원장을 날짜별로, 충전 내역은 충전 요청마다 (충전 취소는 여기서)
 */
export function ShopWalletHistoryPage() {
  const walletPaths = walletPathsOf(useArea())
  // 탭은 주소(?tab=)에 둔다 → 예치금 화면의 「충전 내역」에서 바로 연다
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'charges' ? 'charges' : 'all'
  const transactions = useWalletTransactionsQuery()
  const charges = useChargeHistoryQuery()

  return (
    <div className="shop-look space-y-6">
      <Link
        to={walletPaths.wallet}
        className="text-ink-3 hover:text-ink inline-flex items-center gap-1 rounded-md text-[13px] font-semibold transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        예치금
      </Link>
      <PageHeader
        title="이용 내역"
        step="④"
        description="충전, 충전 취소, 주문 결제, 환불, 정산 적립과 거래 뒤 잔액이에요."
        note="이용 내역은 BE 입출금 원장, 충전 내역은 충전 요청 목록이에요. 충전 취소는 토스 결제 취소예요."
      />
      <div role="tablist" aria-label="내역 종류" className="border-rule flex gap-6 border-b">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() =>
              setParams(item.value === 'all' ? {} : { tab: item.value }, { replace: true })
            }
            className={cn(
              '-mb-px flex min-h-11 items-center border-b-2 text-[15px] font-bold transition-colors',
              tab === item.value
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink border-transparent',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'all' ? (
        <section aria-label="이용 내역 목록">
          {transactions.isPending && <StateMessage>불러오는 중…</StateMessage>}
          {transactions.isError && (
            <StateMessage tone="error">{getErrorMessage(transactions.error)}</StateMessage>
          )}
          {transactions.data?.length === 0 && <StateMessage>거래가 없어요.</StateMessage>}
          {transactions.data && transactions.data.length > 0 && (
            <WalletTransactionList transactions={transactions.data} isGroupedByDay />
          )}
        </section>
      ) : (
        <section aria-label="충전 내역 목록">
          {charges.isPending && <StateMessage>불러오는 중…</StateMessage>}
          {charges.isError && (
            <StateMessage tone="error">{getErrorMessage(charges.error)}</StateMessage>
          )}
          {charges.data?.length === 0 && <StateMessage>충전한 내역이 없어요.</StateMessage>}
          {charges.data && charges.data.length > 0 && (
            <div className="divide-rule divide-y">
              {charges.data.map((charge) => (
                <ChargeRow
                  key={charge.id}
                  charge={charge}
                  action={canCancelCharge(charge) && <CancelChargeButton charge={charge} />}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
