import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'

export function StartSaleButton({ productId }: { productId: string }) {
  const queryClient = useQueryClient()

  const start = useMutation({
    mutationFn: () =>
      runWithAction('판매 시작', () => apiClient.post(`/seller/products/${productId}/start-sale`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={start.isPending} onClick={() => start.mutate()}>
        판매 시작
      </Button>
      {start.isError && <StateMessage tone="error">{getErrorMessage(start.error)}</StateMessage>}
    </div>
  )
}
