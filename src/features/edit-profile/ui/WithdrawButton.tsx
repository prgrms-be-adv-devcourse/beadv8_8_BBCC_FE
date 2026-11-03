import { hasBalanceToRefund } from '@/entities/wallet'
import { confirmAction, formatWon } from '@/shared/lib'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useWithdraw } from '../model/use-edit-profile'
import { MockBadge } from '@/shared/ui/MockBadge'

type WithdrawButtonProps = {
  onDone: () => void
  /** 남은 예치금. 모르면 비워 둔다 (일반 안내로 묻는다) */
  balance?: number
}

/** 탈퇴 (기획서 8장 보완 · 목). 탈퇴하면 예치금 지갑이 동결되고 남은 잔액은 운영자가 환급한다 (BE #670) */
export function WithdrawButton({ onDone, balance }: WithdrawButtonProps) {
  const withdraw = useWithdraw({ onDone })
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-ink-3 underline underline-offset-2"
        disabled={withdraw.isPending}
        onClick={async () => {
          if (
            await confirmAction({
              title: '탈퇴할까요?',
              description: hasBalanceToRefund(balance)
                ? `예치금 ${formatWon(balance ?? 0)}이 남아 있어요. 탈퇴하면 지갑이 동결돼 충전 · 결제를 할 수 없고, 남은 예치금은 운영자가 환급해 드려요.`
                : '탈퇴하면 예치금 지갑이 동결돼요. 시연에서는 탈퇴가 목으로 처리돼요.',
              confirmLabel: hasBalanceToRefund(balance) ? '그래도 탈퇴하기' : '탈퇴하기',
              tone: 'danger',
            })
          )
            withdraw.mutate()
        }}
      >
        탈퇴하기
      </Button>
      <MockBadge endpoints={['DELETE /members/me']} />
      {withdraw.isError && (
        <StateMessage tone="error">{getErrorMessage(withdraw.error)}</StateMessage>
      )}
    </div>
  )
}
