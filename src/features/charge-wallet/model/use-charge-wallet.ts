import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import {
  rememberCharge,
  toChargeConfirmation,
  toChargePayment,
  toConfirmChargeRequest,
  walletApi,
  walletKeys,
} from '@/entities/wallet'
import { runWithAction } from '@/shared/api'
import { env } from '@/shared/config'
import { openTossPayment } from '../lib/toss'

/** 충전 요청(서버) → 토스 결제창으로 이동. 돌아오면 useConfirmCharge가 승인한다 */
export function useRequestCharge(returnTo: { successPath: string; failPath: string }) {
  return useMutation({
    mutationFn: (amount: number) =>
      runWithAction('예치금 충전 요청', async () => {
        const payment = toChargePayment(await walletApi.requestCharge(amount))
        await openTossPayment(
          env.tossClientKey,
          {
            orderId: payment.tossOrderId,
            amount: payment.amount,
          },
          returnTo,
        )
      }),
  })
}

/** 토스 successUrl로 돌아온 값으로 한 번만 승인한다. 돌아온 것만으로 잔액을 올리지 않는다 */
export function useConfirmCharge(search: URLSearchParams) {
  const queryClient = useQueryClient()
  const started = useRef(false)
  const request = toConfirmChargeRequest(search)

  const mutation = useMutation({
    mutationFn: () =>
      runWithAction('예치금 충전 승인', async () =>
        toChargeConfirmation(await walletApi.confirmCharge(request!)),
      ),
    onSuccess: (confirmation) => {
      rememberCharge(confirmation.chargeId)
      void queryClient.invalidateQueries({ queryKey: walletKeys.me })
    },
  })
  const { mutate } = mutation

  useEffect(() => {
    // StrictMode에서 두 번 승인하지 않도록 한 번만
    if (request && !started.current) {
      started.current = true
      mutate()
    }
  }, [request, mutate])

  return { ...mutation, invalidRequest: request === null }
}
