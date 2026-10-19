import { useState } from 'react'
import { Link } from 'react-router'
import { isChargeConfirming } from '@/entities/wallet'
import { getErrorMessage, isTimeoutError } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/StateMessage'
import { readChargeReturn } from '../lib/charge-return'
import { useConfirmCharge } from '../model/use-charge-wallet'

type ConfirmChargeProps = {
  search: URLSearchParams
  walletHref: string
}

type ConfirmingNoticeProps = { amount: number; walletHref: string }

// 토스 결과를 아직 모름: BE가 202(승인 중)를 줬거나, 응답이 늦어 기다리지 못했을 때 (BE는 처리했을 수 있음)
function ConfirmingNotice({ amount, walletHref }: ConfirmingNoticeProps) {
  return (
    <div className="space-y-2">
      <p>
        토스 결제 결과를 확인하는 중이에요 ({formatWon(amount)}). 충전 내역에서 상태를 확인해
        주세요.
      </p>
      <Link to={walletHref} className="text-primary underline">
        충전 내역 보기
      </Link>
    </div>
  )
}

export function ConfirmCharge({ search, walletHref }: ConfirmChargeProps) {
  const confirm = useConfirmCharge(search)
  const [afterCharge] = useState(readChargeReturn)

  if (confirm.invalidRequest)
    return <StateMessage tone="error">승인에 필요한 값이 없어요.</StateMessage>
  if (confirm.isError && isTimeoutError(confirm.error))
    return <ConfirmingNotice amount={confirm.amount} walletHref={walletHref} />
  if (confirm.isError)
    return <StateMessage tone="error">{getErrorMessage(confirm.error)}</StateMessage>
  if (!confirm.data) return <StateMessage>충전을 승인하는 중이에요…</StateMessage>
  if (isChargeConfirming(confirm.data))
    return <ConfirmingNotice amount={confirm.data.amount} walletHref={walletHref} />
  return (
    <div className="space-y-2">
      <p>
        {formatWon(confirm.data.amount)} 충전했어요.
        {confirm.data.balance !== null && ` 잔액 ${formatWon(confirm.data.balance)}`}
      </p>
      <div className="flex flex-wrap gap-4">
        {afterCharge && (
          <Link to={afterCharge.path} className="text-primary font-semibold underline">
            {afterCharge.label}
          </Link>
        )}
        <Link to={walletHref} className="text-primary underline">
          예치금으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
