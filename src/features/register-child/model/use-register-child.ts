import { useMutation, useQueryClient } from '@tanstack/react-query'
import { childApi, childKeys, toChildRequest, type ChildForm } from '@/entities/child'
import { runWithAction } from '@/shared/api'

export function useRegisterChild() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: ChildForm) =>
      runWithAction('자녀 등록', () => childApi.register(toChildRequest(form))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: childKeys.all }),
  })
}
