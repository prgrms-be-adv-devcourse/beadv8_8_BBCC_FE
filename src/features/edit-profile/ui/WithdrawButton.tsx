import { confirmAction } from '@/shared/lib'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useWithdraw } from '../model/use-edit-profile'
import { MockBadge } from '@/shared/ui/MockBadge'

type WithdrawButtonProps = { onDone: () => void }

/** 탈퇴 (기획서 8장 보완, 조건 보류 · 목) */
export function WithdrawButton({ onDone }: WithdrawButtonProps) {
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
              description: '탈퇴 조건은 아직 정해지지 않아 시연용(목)이에요.',
              confirmLabel: '탈퇴하기',
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
