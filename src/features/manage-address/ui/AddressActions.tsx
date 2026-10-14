import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addressKeys, type ShippingAddress } from '@/entities/address'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'

export function AddressActions({ address }: { address: ShippingAddress }) {
  const queryClient = useQueryClient()
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: addressKeys.all })

  const makeDefault = useMutation({
    mutationFn: () =>
      runWithAction('기본 배송지 변경', () =>
        apiClient.patch(`/members/me/addresses/${address.id}/default`),
      ),
    onSuccess,
  })
  const remove = useMutation({
    mutationFn: () =>
      runWithAction('배송지 삭제', () => apiClient.delete(`/members/me/addresses/${address.id}`)),
    onSuccess,
  })
  const error = makeDefault.error ?? remove.error

  return (
    <div className="flex items-center gap-1">
      {!address.isDefault && (
        <Button
          size="sm"
          variant="outline"
          disabled={makeDefault.isPending}
          onClick={() => makeDefault.mutate()}
        >
          기본으로
        </Button>
      )}
      <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate()}>
        삭제
      </Button>
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
