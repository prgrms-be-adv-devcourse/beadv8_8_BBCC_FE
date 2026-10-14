import type { ShippingAddress } from '@/entities/address'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'
import { useAddressActions } from '../model/use-manage-address'

export function AddressActions({ address }: { address: ShippingAddress }) {
  const { makeDefault, remove, pending, error } = useAddressActions(address.id)

  return (
    <div className="flex items-center gap-1">
      {!address.isDefault && (
        <Button size="sm" variant="outline" disabled={pending} onClick={makeDefault}>
          기본으로
        </Button>
      )}
      <Button size="sm" variant="ghost" disabled={pending} onClick={remove}>
        삭제
      </Button>
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
