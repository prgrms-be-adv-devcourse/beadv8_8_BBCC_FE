import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { rememberCharge, walletKeys } from '@/entities/wallet'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { StateMessage } from '@/shared/ui/page-header'

type ChargeConfirmResponse = {
  chargeId: number
  status: string
  amount: number
  balance: number | null
}

/** 토스 successUrl로 돌아온 값으로 승인을 요청한다. 돌아온 것만으로 잔액을 올리지 않는다 */
export function ConfirmCharge({ search }: { search: URLSearchParams }) {
  const queryClient = useQueryClient()
  const started = useRef(false)

  const confirm = useMutation({
    mutationFn: () =>
      runWithAction('예치금 충전 승인', () =>
        apiClient.post<ChargeConfirmResponse>('/wallets/me/charges/confirm', {
          paymentKey: search.get('paymentKey'),
          orderId: search.get('orderId'),
          amount: Number(search.get('amount')),
        }),
      ),
    onSuccess: (response) => {
      rememberCharge(response.data.chargeId)
      void queryClient.invalidateQueries({ queryKey: walletKeys.me })
    },
  })

  useEffect(() => {
    // StrictMode에서 두 번 승인하지 않도록 한 번만
    if (!started.current) {
      started.current = true
      confirm.mutate()
    }
  }, [confirm])

  if (confirm.isPending || confirm.isIdle)
    return <StateMessage>충전을 승인하는 중이에요…</StateMessage>
  if (confirm.isError)
    return <StateMessage tone="error">{getErrorMessage(confirm.error)}</StateMessage>
  const result = confirm.data.data
  return (
    <div className="space-y-2">
      <p>
        {formatWon(result.amount)} 충전했어요.
        {result.balance !== null && ` 잔액 ${formatWon(result.balance)}`}
      </p>
      <Link to="/wallet" className="text-primary underline">
        예치금으로 돌아가기
      </Link>
    </div>
  )
}
