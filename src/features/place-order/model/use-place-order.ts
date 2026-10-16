import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { ShippingAddress } from '@/entities/address'
import { cartKeys, type CartLine } from '@/entities/cart'
import { orderApi, toOrder, toPlaceOrderRequest, type Order } from '@/entities/order'
import { getErrorStatus, getErrorTitle, runWithAction } from '@/shared/api'
import { toPlaceOrderInput } from './place-order.mapper'
import { createRequestKeyHolder, KEY_REUSED_TITLE } from './request-key'

/**
 * 주문하기. 응답은 결제 결과가 아니라 결제대기 주문이다(재고 차감 → 예치금 결제는 서버 이벤트).
 * 같은 내용으로 다시 누르면 같은 멱등키를 보내 주문이 하나만 생긴다 (BE #351). 200(기존 주문)도 성공이다.
 * 화면 이동은 onPlaced로 받는다 (주문 상세가 그 시점 상태를 보여 준다)
 */
export function usePlaceOrder({ onPlaced }: { onPlaced: (order: Order) => void }) {
  const queryClient = useQueryClient()
  const [requestKey] = useState(() => createRequestKeyHolder())

  const mutation = useMutation({
    mutationFn: ({ lines, address }: { lines: CartLine[]; address: ShippingAddress }) => {
      const request = toPlaceOrderRequest(toPlaceOrderInput(lines, address))
      return runWithAction('주문하기', () => orderApi.place(request, requestKey.keyFor(request)))
    },
    onSuccess: (dto) => {
      requestKey.reset()
      void queryClient.invalidateQueries({ queryKey: cartKeys.mine })
      onPlaced(toOrder(dto))
    },
    onError: (error) => {
      if (getErrorStatus(error) !== 409) return
      // 키가 이미 다른 주문에 쓰였으면 새 키로 다시 주문하게 한다
      if (getErrorTitle(error) === KEY_REUSED_TITLE) requestKey.reset()
      // 가격 변경 · 판매 중 아님(409): 장바구니를 다시 불러와 사용자가 다시 확인하게 한다 (자동 재주문 없음)
      void queryClient.invalidateQueries({ queryKey: cartKeys.mine })
    },
  })

  return { ...mutation, needsRecheck: getErrorStatus(mutation.error) === 409 }
}
