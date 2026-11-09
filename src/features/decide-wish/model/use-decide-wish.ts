import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PlaceOrderInput } from '@/entities/order'
import { wishKeys, type WishRequest } from '@/entities/wish'
import { getErrorStatus, runWithAction } from '@/shared/api'
import { newRequestKey } from '@/shared/lib'
import { decideWishApi } from '../api/decide-wish-api'

/**
 * 조르기 승인(= 주문하기) · 거절. 409(이미 처리됨 · 가격 변경 · 예약 수량 초과 등) · 승인의 403(예약이 풀린 칸)이면 조르기를 다시 불러와 보호자가 다시 확인하게
 * 한다 (자동 재요청 없음). 승인 결과(결제 완료 · 잔액 부족 취소)는 주문 상세에서 본다
 */
export function useDecideWish(wish: Pick<WishRequest, 'requestId' | 'childId'>) {
  const queryClient = useQueryClient()
  const refresh = () =>
    Promise.all(
      [
        wishKeys.request(wish.requestId),
        wishKeys.timeline(wish.requestId),
        wishKeys.requests(wish.childId),
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    )
  const refreshOnConflict = (error: unknown) => {
    if (getErrorStatus(error) === 409) void refresh()
  }
  const isStale = (error: unknown) => [403, 409].includes(getErrorStatus(error) ?? 0)
  const approve = useMutation({
    mutationFn: (input: PlaceOrderInput) =>
      runWithAction('조르기 승인 (주문하기)', () => decideWishApi.approve(input, newRequestKey())),
    onSuccess: refresh,
    // 그사이 거절 · 철회돼 예약이 풀린 칸은 403(주문할 수 없는 장바구니 상품)이라 이때도 다시 불러온다
    onError: (error) => {
      if (isStale(error)) void refresh()
    },
  })
  const reject = useMutation({
    mutationFn: (reason: string) =>
      runWithAction('조르기 거절', () => decideWishApi.reject(wish.requestId, { reason })),
    onSuccess: refresh,
    onError: refreshOnConflict,
  })
  const needsRecheck = isStale(approve.error) || getErrorStatus(reject.error) === 409
  return { approve, reject, needsRecheck }
}
