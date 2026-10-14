import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ShippingAddress } from '@/entities/address'
import { cartKeys, type CartLine } from '@/entities/cart'
import { orderApi, toOrder, toPlaceOrderRequest, type Order } from '@/entities/order'
import { getErrorStatus, runWithAction } from '@/shared/api'
import { toPlaceOrderInput } from './place-order.mapper'

/**
 * 주문하기. 응답은 결제 결과가 아니라 결제대기 주문이다(재고 차감 → 예치금 결제는 서버 이벤트).
 * 화면 이동은 onPlaced로 받는다.
 */
export function usePlaceOrder({ onPlaced }: { onPlaced: (order: Order) => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ lines, address }: { lines: CartLine[]; address: ShippingAddress }) =>
      runWithAction('주문하기', () =>
        orderApi.place(toPlaceOrderRequest(toPlaceOrderInput(lines, address))),
      ),
    onSuccess: (dto) => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.mine })
      onPlaced(toOrder(dto))
    },
    onError: (error) => {
      // 가격 변경 · 판매 중 아님(409): 장바구니를 다시 불러와 사용자가 다시 확인하게 한다 (자동 재주문 없음)
      if (getErrorStatus(error) === 409) {
        void queryClient.invalidateQueries({ queryKey: cartKeys.mine })
      }
    },
  })

  return { ...mutation, needsRecheck: getErrorStatus(mutation.error) === 409 }
}
