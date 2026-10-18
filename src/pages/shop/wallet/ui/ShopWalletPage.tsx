import { useSearchParams } from 'react-router'
import {
  canCancelCharge,
  ChargeRow,
  isAwaitingPayment,
  useChargeHistoryQuery,
  useWalletQuery,
  useWalletTransactionsQuery,
  validateChargeAmount,
  WalletBalanceCard,
  WalletTransactionList,
} from '@/entities/wallet'
import { CancelChargeButton } from '@/features/cancel-charge'
import { AbandonChargeButton, ChargeForm } from '@/features/charge-wallet'
import { getErrorMessage } from '@/shared/api'
import { walletPathsOf } from '@/shared/config'
import { formatDateTime, formatWon, safeReturnPath, useArea } from '@/shared/lib'
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
  // 돌아가기 문구는 보낸 화면이 정한다 (예: 자동 시연). 없으면 주문서
  const returnLabel = search.get('returnLabel')?.trim().slice(0, 20) || '주문서로 돌아가기'
  const afterCharge = returnPath ? { path: returnPath, label: returnLabel } : null
  // 결제창에서 돌아오지 않은 충전 (예: 간편결제 앱에서 잔액을 충전하다 결제가 끝나지 않음)
  const now = new Date()
  const awaiting = charges.data?.filter((charge) => isAwaitingPayment(charge, now)) ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        title="예치금"
        step="④"
        description="주문은 예치금으로 결제돼요. 토스 테스트 결제로 충전해요."
        note="충전은 토스 테스트 결제로 하고, 돌아오면 서버가 토스에 승인을 요청해요. 충전 취소는 토스 결제 취소예요."
      />
      <WalletBalanceCard wallet={wallet.data} pending={wallet.isPending} error={wallet.error} />
      {awaiting.length > 0 && (
        <Card className="space-y-2">
          <CardTitle>결제가 끝나지 않은 충전이 있어요</CardTitle>
          <p className="text-muted-foreground text-xs">
            결제창에서 결제를 마치지 못했어요. 잔액은 바뀌지 않았고, 시간이 지나면 자동으로 끝나요.
            다시 충전하려면 아래에서 새로 요청해 주세요.
          </p>
          {awaiting.map((charge) => (
            <div
              key={charge.id}
              className="flex items-center justify-between border-t pt-2 text-sm"
            >
              <span>
                {formatWon(charge.amount)} · {formatDateTime(charge.expiresAt)}에 자동으로 끝나요
              </span>
              <AbandonChargeButton tossOrderId={charge.tossOrderId} />
            </div>
          ))}
        </Card>
      )}
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
