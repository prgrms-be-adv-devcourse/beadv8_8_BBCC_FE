import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  childApi,
  childKeys,
  toChildRequest,
  type BodyType,
  type ChildForm,
  type GrowthRecordDto,
} from '@/entities/child'
import { runWithAction } from '@/shared/api'

/** 자녀 수정 (전체 교체). 키 · 체형이 바뀌면 서버가 성장 이력을 쌓고 child.changed로 추천 · 주문에 알린다 */
export function useUpdateChild(childId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: ChildForm) =>
      runWithAction('자녀 수정', () => childApi.update(childId, toChildRequest(form))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: childKeys.all }),
  })
}

/** 자녀 삭제 (논리 삭제). 목록 · 추천에서 빠지고, 지난 주문의 자녀 정보는 그대로 남는다 */
export function useDeleteChild(childId: string, { onDeleted }: { onDeleted: () => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => runWithAction('자녀 삭제', () => childApi.remove(childId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: childKeys.all })
      onDeleted()
    },
  })
}

/** 성장 이력 수정 (목). 응답으로 목록 캐시만 고친다 — 다시 조회하면 서버 값 */
export function useUpdateGrowthRecord(childId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      recordId,
      heightCm,
      bodyType,
    }: {
      recordId: string
      heightCm: number
      bodyType: BodyType | null
    }) =>
      runWithAction('성장 이력 수정', () =>
        childApi.updateGrowthRecord(childId, recordId, { heightCm, bodyType }),
      ),
    onSuccess: (updated) =>
      queryClient.setQueryData<GrowthRecordDto[]>(childKeys.growth(childId), (list) =>
        list?.map((record) => (record.id === updated.id ? updated : record)),
      ),
  })
}
