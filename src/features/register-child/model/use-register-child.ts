import { useMutation, useQueryClient } from '@tanstack/react-query'
import { childApi, childKeys, toChildRequest, type ChildForm } from '@/entities/child'
import { toast } from '@/shared/lib'
import { runWithAction } from '@/shared/api'

export function useRegisterChild() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: ChildForm) =>
      runWithAction('자녀 등록', () => childApi.register(toChildRequest(form))),
    onSuccess: () => {
      toast('자녀를 등록했어요')
      return queryClient.invalidateQueries({ queryKey: childKeys.all })
    },
  })
}
