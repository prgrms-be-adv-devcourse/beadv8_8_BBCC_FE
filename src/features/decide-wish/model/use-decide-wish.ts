import { useMutation, useQueryClient } from '@tanstack/react-query'
import { wishKeys, type WishRequest } from '@/entities/wish'
import { getErrorStatus, runWithAction } from '@/shared/api'
import type { ApproveWishRequestDto } from '../api/decision.dto'
import { decideWishApi } from '../api/decide-wish-api'

/**
 * 조르기 승인 · 거절. 409(이미 처리됨 · 가격 변경 등)면 조르기를 다시 불러와 보호자가 다시 확인하게 한다 (자동 재요청 없음)
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
  const approve = useMutation({
    mutationFn: (request: ApproveWishRequestDto) =>
      runWithAction('조르기 승인', () => decideWishApi.approve(wish.requestId, request)),
    onSuccess: refresh,
    onError: refreshOnConflict,
  })
  const reject = useMutation({
    mutationFn: (reason: string) =>
      runWithAction('조르기 거절', () => decideWishApi.reject(wish.requestId, { reason })),
    onSuccess: refresh,
    onError: refreshOnConflict,
  })
  const error = approve.error ?? reject.error
  return { approve, reject, needsRecheck: getErrorStatus(error) === 409 }
}
