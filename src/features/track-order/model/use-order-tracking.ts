import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { isPaymentDelayed, paymentPendingMs, useOrderQuery } from '@/entities/order'
import {
  checkOrderPayment,
  findPaymentOfOrder,
  paymentKeys,
  usePaymentsQuery,
} from '@/entities/payment'
import { walletKeys } from '@/entities/wallet'

/**
 * 주문 상세 추적: 결제 처리 중이면 다시 조회(간격은 주문 조회가 정함), 결과가 나오면 잔액 · 결제 기록을 다시 받아
 * 주문 상태 ↔ 결제 기록을 맞춰 본다. 콘솔 · 쇼핑 주문 상세가 같이 쓴다
 */
export function useOrderTracking(orderId: string) {
  const query = useOrderQuery(orderId)
  const queryClient = useQueryClient()
  const status = query.data?.status
  const awaiting = status === 'PENDING_PAYMENT'
  // 결제 결과가 나온 뒤에만 결제 도메인 기록을 조회한다 (처리 중에는 기록이 없거나 반영 전)
  const payments = usePaymentsQuery({ enabled: query.isSuccess && !awaiting })

  // 결제 결과가 나오면 예치금 차감과 결제 기록을 화면 · 흐름 패널(상태 변화)에서 확인하도록 다시 조회한다
  useEffect(() => {
    if (status && status !== 'PENDING_PAYMENT') {
      void queryClient.invalidateQueries({ queryKey: walletKeys.me })
      void queryClient.invalidateQueries({ queryKey: paymentKeys.list })
    }
  }, [status, queryClient])

  const order = query.data ?? null
  const payment = order ? findPaymentOfOrder(payments.data, order.id) : null
  return {
    query,
    order,
    payments,
    payment,
    paymentCheck: order ? checkOrderPayment(order, payment) : null,
    /** 결제 처리 중이 30초를 넘었다 (서버 이벤트가 오지 않음) */
    delayed:
      order !== null &&
      awaiting &&
      isPaymentDelayed(paymentPendingMs(order.id, query.dataUpdatedAt)),
  }
}
