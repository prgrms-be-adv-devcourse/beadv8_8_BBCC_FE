import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  catalogApi,
  catalogKeys,
  toMeasurementItemRequest,
  type MeasurementItemForm,
} from '@/entities/catalog'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'

function useRefetch(queryKey: readonly string[], message: string) {
  const queryClient = useQueryClient()
  return () => {
    toast(message)
    return queryClient.invalidateQueries({ queryKey })
  }
}

/** 실측 항목 만들기. 코드가 겹치면 409 */
export function useCreateMeasurementItem() {
  const onSuccess = useRefetch(catalogKeys.measurementItems, '실측 항목을 만들었어요')
  return useMutation({
    mutationFn: (form: MeasurementItemForm) =>
      runWithAction('실측 항목 만들기', () =>
        catalogApi.createMeasurementItem(toMeasurementItemRequest(form)),
      ),
    onSuccess,
  })
}
