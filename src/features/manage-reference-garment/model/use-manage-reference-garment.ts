import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GARMENT_PART_SPEC,
  recommendationApi,
  recommendationKeys,
  toReferenceGarment,
  toReferenceGarmentRequest,
  type GarmentPart,
  type ReferenceGarmentForm,
} from '@/entities/recommendation'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'

/** 기준 옷이 바뀌면 그 자녀의 기준 옷과 추천(맞춤 목록 · 사이즈)을 다시 읽는다 */
function useRefetchRecommendation(message: string) {
  const queryClient = useQueryClient()
  return () => {
    toast(message)
    return queryClient.invalidateQueries({ queryKey: recommendationKeys.all })
  }
}

/**
 * 기준 옷 저장 (PUT, 처음이든 교체든 같다). 뺀 선택 실측은 사라진다.
 * onSaved는 mutation 옵션에서 부른다: 저장 뒤 다시 읽는 사이 편집기가 새로 그려져도(key 변경) 빠지지 않게
 */
export function useSaveReferenceGarment(childId: string, part: GarmentPart, onSaved?: () => void) {
  const label = GARMENT_PART_SPEC[part].label
  const refetch = useRefetchRecommendation(`${label} 기준 옷을 저장했어요`)
  return useMutation({
    mutationFn: (form: ReferenceGarmentForm) =>
      runWithAction(`${label} 기준 옷 저장`, () =>
        recommendationApi.saveReferenceGarment(childId, part, toReferenceGarmentRequest(form)),
      ).then(toReferenceGarment),
    onSuccess: () => {
      onSaved?.()
      return refetch()
    },
  })
}

/** 기준 옷 지우기 (DELETE, 이미 없어도 204) */
export function useDeleteReferenceGarment(childId: string, part: GarmentPart) {
  const label = GARMENT_PART_SPEC[part].label
  const onSuccess = useRefetchRecommendation(`${label} 기준 옷을 지웠어요`)
  return useMutation({
    mutationFn: () =>
      runWithAction(`${label} 기준 옷 삭제`, () =>
        recommendationApi.deleteReferenceGarment(childId, part),
      ),
    onSuccess,
  })
}
