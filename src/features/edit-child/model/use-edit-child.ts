import { useMutation, useQueryClient } from '@tanstack/react-query'
import { childApi, childKeys, toChildRequest, type ChildForm } from '@/entities/child'
import { toast } from '@/shared/lib'
import { runWithAction } from '@/shared/api'

/** 자녀 수정 (전체 교체). 키 · 체형이 바뀌면 서버가 성장 이력을 쌓고 child.changed로 추천 · 주문에 알린다 */
export function useUpdateChild(childId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: ChildForm) =>
      runWithAction('자녀 수정', () => childApi.update(childId, toChildRequest(form))),
    onSuccess: () => {
      toast('저장했어요 · 키 · 체형이 바뀌었으면 성장 이력에 쌓여요')
      return queryClient.invalidateQueries({ queryKey: childKeys.all })
    },
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

export function useDeleteGrowthRecord(childId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (recordId: string) =>
      runWithAction('성장 기록 삭제', () => childApi.removeGrowthRecord(childId, recordId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: childKeys.all }),
  })
}
