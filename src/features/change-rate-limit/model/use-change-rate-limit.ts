import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatRateLimit, RATE_LIMIT_TARGET_LABEL, rateLimitKeys } from '@/entities/rate-limit'
import { runWithAction } from '@/shared/api'
import { toast, withObjectParticle } from '@/shared/lib'
import { changeRateLimitApi } from '../api/change-rate-limit-api'
import { toRateLimitRequest, type RateLimitChange } from './rate-limit.mapper'

function doneMessageOf(change: RateLimitChange): string {
  if ('isEnabled' in change) return `요청 수 제한을 ${change.isEnabled ? '켰어요' : '껐어요'}`
  const label = withObjectParticle(RATE_LIMIT_TARGET_LABEL[change.target])
  return `${label} ${formatRateLimit(change.limit)}으로 바꿨어요`
}

/**
 * 요청 수 제한 설정 변경. 응답(바뀐 뒤 설정 전체)으로 조회 캐시를 바로 바꾼다.
 * 다시 조회하지 않는다: Gateway가 여러 대면 다른 Gateway는 2초 동안 옛 값을 돌려줄 수 있다.
 * 알림도 여기서 띄운다: 캐시가 바뀌면 입력 칸이 새 값으로 다시 그려져 mutate에 넘긴 콜백은 불리지 않을 수 있다
 */
export function useChangeRateLimit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (change: RateLimitChange) =>
      runWithAction('요청 수 제한 변경', () =>
        changeRateLimitApi.change(toRateLimitRequest(change)),
      ),
    onSuccess: (settings, change) => {
      queryClient.setQueryData(rateLimitKeys.settings, settings)
      toast(doneMessageOf(change))
    },
  })
}
