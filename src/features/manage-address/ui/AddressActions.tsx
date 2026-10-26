import type { ShippingAddress } from '@/entities/address'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useAddressActions } from '../model/use-manage-address'

type AddressActionsProps = { address: ShippingAddress; onEdit: () => void }

/** 배송지 한 줄 아래 버튼: 수정 · 삭제 · 기본 배송지로 설정 */
export function AddressActions({ address, onEdit }: AddressActionsProps) {
  const { makeDefault, remove, pending, error } = useAddressActions(address.id)

  const handleRemove = async () => {
    const ok = await confirmAction({
      title: '배송지를 삭제할까요?',
      description: `${address.recipientName} · ${address.fullAddress}`,
      confirmLabel: '삭제',
      tone: 'danger',
    })
    if (ok) remove()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" className="h-8 px-3" onClick={onEdit}>
          수정
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3"
          disabled={pending}
          onClick={handleRemove}
        >
          삭제
        </Button>
        {!address.isDefault && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3"
            disabled={pending}
            onClick={makeDefault}
          >
            기본 배송지로 설정
          </Button>
        )}
      </div>
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </div>
  )
}
