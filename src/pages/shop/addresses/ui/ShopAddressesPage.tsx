import { useState } from 'react'
import { useAddressesQuery } from '@/entities/address'
import { AddressActions, AddressForm } from '@/features/manage-address'
import { getErrorMessage } from '@/shared/api'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ShopAddressesPage() {
  const addresses = useAddressesQuery()
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <PageHeader
        title="배송지"
        step="①"
        description="주문할 때 여기 등록한 배송지 중에서 골라요."
        note="주문은 회원 API를 부르지 않아요. 화면이 여기서 고른 배송지를 주문 요청에 담아 보내요."
      />
      <AddressForm />
      <div className="space-y-2">
        <h2 className="font-semibold">내 배송지</h2>
        {addresses.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {addresses.isError && (
          <StateMessage tone="error">{getErrorMessage(addresses.error)}</StateMessage>
        )}
        {addresses.data?.length === 0 && <StateMessage>등록한 배송지가 없어요.</StateMessage>}
        {addresses.data?.map((address) =>
          editingId === address.id ? (
            <AddressForm key={address.id} edit={{ address, onDone: () => setEditingId(null) }} />
          ) : (
            <Card key={address.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {address.recipientName} {address.isDefault && <Badge>기본</Badge>}
                </p>
                <p className="text-muted-foreground text-sm">
                  {address.phone} · ({address.zipCode}) {address.fullAddress}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => setEditingId(address.id)}>
                  수정
                </Button>
                <AddressActions address={address} />
              </div>
            </Card>
          ),
        )}
      </div>
    </div>
  )
}
