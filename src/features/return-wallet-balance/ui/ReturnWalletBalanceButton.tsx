import { canReturnWalletBalance, type AdminWallet } from '@/entities/wallet'
import { getErrorMessage } from '@/shared/api'
import { confirmAction, formatWon } from '@/shared/lib'
import { useReturnWalletBalance } from '../model/use-return-wallet-balance'

type ReturnWalletBalanceButtonProps = { wallet: AdminWallet }

/** 잔액 돌려주기: 탈퇴로 동결된 지갑에 잔액이 남았을 때만 보인다. 확인 창을 거치고, 요청 중에는 막는다 */
export function ReturnWalletBalanceButton({ wallet }: ReturnWalletBalanceButtonProps) {
  const returnBalance = useReturnWalletBalance()
  const canReturn = canReturnWalletBalance(wallet)
  if (!canReturn && returnBalance.isIdle) return null

  const handleReturn = async () => {
    const confirmed = await confirmAction({
      title: '잔액을 돌려줬다고 기록할까요?',
      description: `회원 #${wallet.memberId}의 남은 예치금 ${formatWon(wallet.balance)}을 돌려준 것으로 기록하고 잔액을 0원으로 만들어요. 이 화면에서 실제로 송금하지는 않아요.`,
      confirmLabel: '잔액 돌려주기',
    })
    if (confirmed) returnBalance.mutate(wallet)
  }

  return (
    <div className="space-y-1">
      {canReturn && (
        <button
          type="button"
          className="text-ink-2 hover:text-ink inline-flex min-h-11 items-center text-[13px] font-semibold underline underline-offset-4 transition-colors disabled:opacity-50 lg:min-h-8"
          disabled={returnBalance.isPending}
          aria-busy={returnBalance.isPending}
          onClick={handleReturn}
        >
          잔액 돌려주기
        </button>
      )}
      {returnBalance.isError && (
        <p role="alert" className="text-destructive text-xs">
          {getErrorMessage(returnBalance.error)}
        </p>
      )}
      {returnBalance.isSuccess && (
        <p role="status" className="text-ink-3 text-xs">
          {`${formatWon(returnBalance.data.amount)}을 돌려줬다고 기록했어요`}
        </p>
      )}
    </div>
  )
}
