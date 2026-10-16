import type { OrderDetailDto, OrderTimelineDto } from '@/entities/order'
import type { PaymentSummaryDto } from '@/entities/payment'
import type { MockHandler, Page } from '@/shared/api'
import { getErrorStatus } from '@/shared/api'
import { fetchReal, problem } from './mock-utils'

// 주문 처리 타임라인(BE #352)은 계약만 확정, 구현 전 → 실제 주문 상세 · 결제 내역으로 만든다.
// 결제 요청 시각은 주문 상세에 없어 결제 생성 시각(없으면 주문 시각, approximate)으로 대신한다

type Step = OrderTimelineDto['steps'][number]
type Detail = Step['details'][number]

const latest = (values: (string | null)[]) =>
  values.reduce<string | null>((max, value) => (value && (!max || value > max) ? value : max), null)

function groupStep(step: string, details: Detail[]): Step {
  const done = details.filter((detail) => detail.status === 'DONE').length
  const status =
    details.length === 0 || done === 0 ? 'WAITING' : done === details.length ? 'DONE' : 'PARTIAL'
  return {
    step,
    status,
    at: status === 'DONE' ? latest(details.map((detail) => detail.at)) : null,
    approximate: false,
    details,
  }
}

const simple = (step: string, status: string, at: string | null, approximate = false): Step => ({
  step,
  status,
  at,
  approximate,
  details: [],
})

/** 주문 상세 + 결제 → 타임라인 (BE #352 결정: steps는 순서 있는 배열, 취소는 마지막 완료 단계 뒤) */
export function buildOrderTimeline(
  order: OrderDetailDto,
  payment: PaymentSummaryDto | null,
): OrderTimelineDto {
  const steps: Step[] = [simple('CREATED', 'DONE', order.orderedAt)]
  const requestedAt = payment?.createdAt ?? null
  const rest = ['SHIPPED', 'DELIVERED', 'CONFIRMED']

  if (order.status === 'CANCELLED') {
    const requested = order.cancelReason !== 'OUT_OF_STOCK'
    steps.push(
      requested
        ? simple('PAYMENT_REQUESTED', 'DONE', requestedAt ?? order.orderedAt, !requestedAt)
        : simple('PAYMENT_REQUESTED', 'NOT_APPLICABLE', null),
      simple('CANCELLED', 'DONE', requestedAt ?? order.orderedAt, true),
      ...rest.map((step) => simple(step, 'NOT_APPLICABLE', null)),
    )
  } else if (order.status === 'PENDING_PAYMENT') {
    steps.push(
      requestedAt
        ? simple('PAYMENT_REQUESTED', 'DONE', requestedAt)
        : simple('PAYMENT_REQUESTED', 'WAITING', null),
      simple('PAID', 'WAITING', null),
      ...rest.map((step) => simple(step, 'WAITING', null)),
    )
  } else {
    const sellerName = (sellerId: string) =>
      order.items.find((item) => item.sellerId === sellerId)?.sellerName ?? null
    const perSeller = (at: (delivery: OrderDetailDto['deliveries'][number]) => string | null) =>
      order.deliveries.map((delivery) => ({
        sellerOrderId: delivery.sellerOrderId,
        sellerId: delivery.sellerId,
        sellerName: sellerName(delivery.sellerId),
        status: at(delivery) ? 'DONE' : 'WAITING',
        at: at(delivery),
      }))
    steps.push(
      simple('PAYMENT_REQUESTED', 'DONE', requestedAt ?? order.orderedAt, !requestedAt),
      simple('PAID', 'DONE', payment?.paidAt ?? order.orderedAt, !payment?.paidAt),
      groupStep(
        'SHIPPED',
        perSeller((delivery) => delivery.shippedAt),
      ),
      groupStep(
        'DELIVERED',
        perSeller((delivery) => delivery.deliveredAt),
      ),
      groupStep(
        'CONFIRMED',
        order.items.map((item) => ({
          orderItemId: item.orderItemId,
          productName: item.productName,
          status: item.confirmedAt ? 'DONE' : 'WAITING',
          at: item.confirmedAt,
          confirmType: item.confirmType,
        })),
      ),
    )
  }
  const current = [...steps]
    .reverse()
    .find((step) => step.status === 'DONE' || step.status === 'PARTIAL')
  return {
    orderId: order.orderId,
    status: order.status,
    currentStep: current?.step ?? null,
    cancelReason: order.cancelReason,
    paymentDueAt: order.status === 'PENDING_PAYMENT' ? order.paymentDueAt : null,
    steps,
  }
}

export const orderHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/orders/:orderId/timeline',
    handle: async (request) => {
      const { orderId } = request.params
      let order: OrderDetailDto
      try {
        order = await fetchReal<OrderDetailDto>(request, `/orders/${orderId}`)
      } catch (error) {
        if (getErrorStatus(error) === 404)
          return problem(
            404,
            '주문을 찾을 수 없습니다',
            '주문을 찾을 수 없습니다.',
            `/api/v1/orders/${orderId}/timeline`,
          )
        throw error
      }
      const payments = await fetchReal<Page<PaymentSummaryDto>>(request, '/payments?page=0&size=50')
      const payment = payments.content.find((item) => String(item.orderId) === orderId) ?? null
      return { status: 200, data: buildOrderTimeline(order, payment) }
    },
  },
]
