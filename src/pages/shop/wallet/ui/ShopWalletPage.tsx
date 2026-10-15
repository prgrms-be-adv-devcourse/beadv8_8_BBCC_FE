import { useSearchParams } from 'react-router'
import {
  canCancelCharge,
  ChargeRow,
  useChargeHistoryQuery,
  useWalletQuery,
  useWalletTransactionsQuery,
  validateChargeAmount,
  WalletBalanceCard,
  WalletTransactionList,
} from '@/entities/wallet'
import { CancelChargeButton } from '@/features/cancel-charge'
import { ChargeForm } from '@/features/charge-wallet'
import { getErrorMessage } from '@/shared/api'
import { walletPathsOf } from '@/shared/config'
import { safeReturnPath, useArea } from '@/shared/lib'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ShopWalletPage() {
  const wallet = useWalletQuery()
  const walletPaths = walletPathsOf(useArea())
  const charges = useChargeHistoryQuery()
  const transactions = useWalletTransactionsQuery()
  // 주문서에서 "충전하고 돌아오기"로 왔으면 금액을 채우고, 승인 뒤 돌아갈 화면을 넘긴다
  const [search] = useSearchParams()
  const requested = Number(search.get('amount'))
  const initialAmount = validateChargeAmount(requested) === null ? requested : undefined
  const returnPath = safeReturnPath(search.get('return'))
  const afterCharge = returnPath ? { path: returnPath, label: '주문서로 돌아가기' } : null

  return (
    <div className="space-y-4">
      <PageHeader
        title="예치금"
        step="④"
        description="주문은 예치금으로 결제돼요. 토스 테스트 결제로 충전해요."
        note="충전은 토스 테스트 결제로 하고, 돌아오면 서버가 토스에 승인을 요청해요. 충전 취소 · 거래 내역은 백엔드에 없어 목이에요."
      />
      <WalletBalanceCard wallet={wallet.data} pending={wallet.isPending} error={wallet.error} />
      <ChargeForm
        key={`${initialAmount ?? ''}-${returnPath ?? ''}`}
        returnTo={{ successPath: walletPaths.chargeSuccess, failPath: walletPaths.chargeFail }}
        initialAmount={initialAmount}
        afterCharge={afterCharge}
      />
      <Card className="space-y-2">
        <CardTitle>충전 내역</CardTitle>
        {charges.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {charges.isError && (
          <StateMessage tone="error">{getErrorMessage(charges.error)}</StateMessage>
        )}
        {charges.data?.length === 0 && <StateMessage>충전한 내역이 없어요.</StateMessage>}
        {charges.data?.map((charge) => (
          <ChargeRow
            key={charge.id}
            charge={charge}
            action={canCancelCharge(charge) && <CancelChargeButton charge={charge} />}
          />
        ))}
      </Card>
      <Card className="space-y-2">
        <CardTitle>거래 내역</CardTitle>
        <p className="text-muted-foreground text-xs">
          충전 · 충전 취소 · 주문 결제 · 환불 · 정산 적립과 거래 뒤 잔액이에요.
        </p>
        {transactions.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {transactions.isError && (
          <StateMessage tone="error">{getErrorMessage(transactions.error)}</StateMessage>
        )}
        {transactions.data?.length === 0 && <StateMessage>거래가 없어요.</StateMessage>}
        {transactions.data && <WalletTransactionList transactions={transactions.data} />}
      </Card>
    </div>
  )
}
