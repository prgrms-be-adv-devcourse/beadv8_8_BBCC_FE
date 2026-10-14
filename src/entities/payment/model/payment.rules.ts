import { formatWon } from '@/shared/lib'
import type { OrderPaymentInput, Payment, PaymentCheck } from './payment'

export function findPaymentOfOrder(
  payments: Payment[] | undefined,
  orderId: string,
): Payment | null {
  return payments?.find((payment) => payment.orderId === orderId) ?? null
}

const fullyRefunded = (payment: Payment) =>
  payment.status === 'REFUNDED' && payment.refundedAmount === payment.amount

/**
 * 주문 상태 ↔ 결제 도메인 기록을 맞춰 본다 (백엔드: 주문당 결제 1건, 잔액 부족만 실패 기록을 남김).
 * 통합 테스트에서 주문 · 결제 두 도메인이 같은 결과를 갖는지 확인하는 용도다.
 */
export function checkOrderPayment(order: OrderPaymentInput, payment: Payment | null): PaymentCheck {
  if (order.status === 'PENDING_PAYMENT') {
    return payment
      ? { result: 'WAITING', message: '결제 기록이 생겼어요. 주문에 반영되기를 기다려요.' }
      : { result: 'WAITING', message: '아직 결제 기록이 없어요. 결제 이벤트가 끝나기를 기다려요.' }
  }

  if (order.status === 'PAID') {
    if (!payment) {
      return { result: 'MISMATCH', message: '결제 완료 주문인데 결제 기록이 없어요.' }
    }
    if (payment.status === 'FAILED') {
      return { result: 'MISMATCH', message: '결제 완료 주문인데 결제 기록은 실패예요.' }
    }
    if (payment.amount !== order.totalAmount) {
      return {
        result: 'MISMATCH',
        message: `금액이 달라요: 주문 ${formatWon(order.totalAmount)} / 결제 ${formatWon(payment.amount)}`,
      }
    }
    return {
      result: 'MATCH',
      message: `주문 금액 ${formatWon(order.totalAmount)}이 결제 기록과 같아요.`,
    }
  }

  // 취소된 주문: 돈이 빠진 채로 남아 있으면 안 된다
  if (payment && payment.status !== 'FAILED' && !fullyRefunded(payment)) {
    return {
      result: 'MISMATCH',
      message: `취소된 주문인데 결제 기록이 ${payment.status}예요 (${formatWon(payment.amount)}).`,
    }
  }
  if (order.cancelReason === 'PAYMENT_FAILED') {
    return payment
      ? { result: 'MATCH', message: '결제 실패 기록과 주문 취소가 일치해요.' }
      : {
          result: 'INFO',
          message: '결제 기록 없이 실패했어요. 금액 불일치 · 지갑 없음은 기록을 남기지 않아요.',
        }
  }
  return payment
    ? { result: 'MATCH', message: '결제 금액이 전액 환불됐어요.' }
    : { result: 'MATCH', message: '결제 전에 취소돼 결제 기록이 없어요.' }
}
