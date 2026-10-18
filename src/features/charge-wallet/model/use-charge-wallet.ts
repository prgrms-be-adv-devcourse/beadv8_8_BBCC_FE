import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import {
  toCharge,
  toChargeConfirmation,
  toChargePayment,
  toConfirmChargeRequest,
  toFailChargeRequest,
  walletApi,
  walletKeys,
} from '@/entities/wallet'
import { runWithAction } from '@/shared/api'
import { env } from '@/shared/config'
import { rememberChargeReturn, type ChargeReturn } from '../lib/charge-return'
import { openTossPayment, tossErrorCode } from '../lib/toss'

// 사용자가 예치금 화면에서 결제 대기 충전을 그만둘 때 남기는 실패 코드
const ABANDONED_CODE = 'USER_ABANDONED'

/**
 * 충전 요청(서버) → 토스 결제창으로 이동. 돌아오면 useConfirmCharge가 승인한다.
 * 결제창이 failUrl로 이동하지 않고 오류로 끝나면(PC에서 창 닫기 등) 그 충전을 바로 실패로 끝낸다.
 * afterCharge: 승인 뒤 "돌아가기"로 보여 줄 화면 (예: 주문서). 자동으로 이동하거나 주문하지 않는다
 */
export function useRequestCharge(
  returnTo: { successPath: string; failPath: string },
  afterCharge: ChargeReturn | null = null,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (amount: number) =>
      runWithAction('예치금 충전 요청', async () => {
        const payment = toChargePayment(await walletApi.requestCharge(amount))
        rememberChargeReturn(afterCharge)
        try {
          await openTossPayment(
            env.tossClientKey,
            {
              orderId: payment.tossOrderId,
              amount: payment.amount,
            },
            returnTo,
          )
        } catch (error) {
          // 실패 처리가 안 돼도 서버가 30분 뒤 만료로 끝내므로 결제창 오류만 보여 준다
          await walletApi
            .failCharge({ orderId: payment.tossOrderId, code: tossErrorCode(error) })
            .catch(() => undefined)
          throw error
        }
      }),
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.charges })
    },
  })
}

/** 토스 failUrl로 돌아온 충전을 한 번만 실패로 끝낸다. 30분 만료를 기다리지 않는다 */
export function useFailCharge(search: URLSearchParams) {
  const queryClient = useQueryClient()
  const started = useRef(false)
  const request = toFailChargeRequest(search)

  const mutation = useMutation({
    mutationFn: () =>
      runWithAction('예치금 충전 실패 처리', async () =>
        toCharge(await walletApi.failCharge(request!)),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.charges })
    },
  })
  const { mutate } = mutation

  useEffect(() => {
    // StrictMode에서 두 번 부르지 않도록 한 번만 (다시 불러도 서버는 그대로 200)
    if (request && !started.current) {
      started.current = true
      mutate()
    }
  }, [request, mutate])

  return { ...mutation, invalidRequest: request === null }
}

/** 결제창에서 돌아오지 않아 대기 중인 충전을 사용자가 그만둔다 */
export function useAbandonCharge(tossOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      runWithAction('결제 대기 충전 그만두기', async () =>
        toCharge(await walletApi.failCharge({ orderId: tossOrderId, code: ABANDONED_CODE })),
      ),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.charges })
    },
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
    // 실패 · 시간 초과여도 서버에서 충전 상태가 바뀌었을 수 있다 (잔액 · 충전 내역 · 거래 내역, wallet 아래 모두)
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all })
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

  return { ...mutation, invalidRequest: request === null, amount: request?.amount ?? 0 }
}
