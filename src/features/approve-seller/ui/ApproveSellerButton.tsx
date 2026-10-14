import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'

export function ApproveSellerButton({ applicationId }: { applicationId: number }) {
  const queryClient = useQueryClient()

  const approve = useMutation({
    mutationFn: () =>
      runWithAction('판매자 승인', () =>
        apiClient.post(`/admin/seller-applications/${applicationId}/approve`),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller'] }),
  })

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate()}>
        승인
      </Button>
      {approve.isError && (
        <StateMessage tone="error">{getErrorMessage(approve.error)}</StateMessage>
      )}
    </div>
  )
}
