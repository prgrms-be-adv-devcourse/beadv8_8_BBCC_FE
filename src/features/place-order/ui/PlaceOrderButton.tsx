import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { ShippingAddress } from '@/entities/address'
import { cartKeys, type CartLine } from '@/entities/cart'
import type { OrderDetail } from '@/entities/order'
import { apiClient, getErrorMessage, getErrorStatus, runWithAction } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'

type Props = {
  lines: CartLine[]
  address: ShippingAddress | null
  totalAmount: number
}

/**
 * POST /orders는 결제 결과를 주지 않는다(201 + PENDING_PAYMENT).
 * 재고 차감 → 예치금 결제는 서버가 이벤트로 이어서 하므로, 주문 상세로 이동해 결과를 다시 조회한다.
 */
export function PlaceOrderButton({ lines, address, totalAmount }: Props) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const place = useMutation({
    mutationFn: () =>
      runWithAction('주문하기', () =>
        apiClient.post<OrderDetail>('/orders', {
          items: lines.map((line) => ({
            optionId: Number(line.optionId),
            childId: line.childId === null ? null : Number(line.childId),
            quantity: line.quantity,
            // 화면이 본 단가. 서버의 현재 단가와 다르면 409
            unitPrice: line.unitPrice,
          })),
          shippingAddress: {
            recipientName: address!.recipientName,
            phone: address!.recipientPhone,
            zipCode: address!.zipCode,
            address: [address!.roadAddress, address!.detailAddress].filter(Boolean).join(' '),
          },
        }),
      ),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.mine })
      navigate(`/orders/${response.data.orderId}`)
    },
    onError: (error) => {
      // 가격 변경 · 판매 중 아님(409): 장바구니를 다시 불러와 사용자가 다시 확인하게 한다 (자동 재주문 없음)
      if (getErrorStatus(error) === 409) {
        void queryClient.invalidateQueries({ queryKey: cartKeys.mine })
      }
    },
  })

  const disabled = lines.length === 0 || !address || place.isPending

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={disabled}
        onClick={() => {
          if (window.confirm(`${formatWon(totalAmount)}을 예치금으로 결제할까요?`)) place.mutate()
        }}
      >
        {formatWon(totalAmount)} 주문하기
      </Button>
      {place.isError && (
        <StateMessage tone="error">
          {getErrorMessage(place.error)}
          {getErrorStatus(place.error) === 409 &&
            ' 장바구니를 다시 불러왔어요. 확인 후 다시 눌러 주세요.'}
        </StateMessage>
      )}
    </div>
  )
}
