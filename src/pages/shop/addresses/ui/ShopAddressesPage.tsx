import { useState } from 'react'
import { defaultFirst, useAddressesQuery, type ShippingAddress } from '@/entities/address'
import { AddressActions, AddressForm } from '@/features/manage-address'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SideSheet } from '@/shared/ui/SideSheet'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 열린 입력 시트: 새 배송지(address 없음) 또는 수정 */
type AddressSheet = { address?: ShippingAddress }

export function ShopAddressesPage() {
  const addresses = useAddressesQuery()
  const [sheet, setSheet] = useState<AddressSheet | null>(null)
  const closeSheet = () => setSheet(null)

  return (
    <div className="shop-look max-w-2xl space-y-8">
      <PageHeader
        title="배송지 관리"
        step="①"
        description="주문할 때 여기 등록한 배송지 중에서 골라요."
        note="주문은 회원 API를 부르지 않아요. 화면이 여기서 고른 배송지를 주문 요청에 담아 보내요."
      />

      <section aria-label="내 배송지" className="space-y-4">
        <Button
          variant="outline"
          className="border-rule h-12 w-full text-[15px] font-semibold"
          onClick={() => setSheet({})}
        >
          + 새 배송지 추가
        </Button>

        {addresses.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {addresses.isError && (
          <StateMessage tone="error">{getErrorMessage(addresses.error)}</StateMessage>
        )}
        {addresses.data?.length === 0 && (
          <StateMessage>등록한 배송지가 없어요. 주문하려면 배송지를 추가해 주세요.</StateMessage>
        )}
        {addresses.data && addresses.data.length > 0 && (
          <ul className="border-rule divide-rule divide-y border-y">
            {defaultFirst(addresses.data).map((address) => (
              <li key={address.id} className="space-y-3 py-5">
                <div className="space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="text-[15px] font-bold">{address.recipientName}</span>
                    {address.isDefault && (
                      <span className="bg-signal-soft text-signal inline-flex h-5 items-center rounded-sm px-1.5 text-[11px] font-semibold">
                        기본
                      </span>
                    )}
                  </p>
                  <p className="text-[15px]">{address.fullAddress}</p>
                  <p className="text-ink-3 figure text-[13px]">
                    [{address.zipCode}] {address.phone}
                  </p>
                </div>
                <AddressActions address={address} onEdit={() => setSheet({ address })} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <SideSheet
        title={sheet?.address ? '배송지 수정' : '새 배송지 추가'}
        open={sheet !== null}
        onClose={closeSheet}
      >
        {sheet && <AddressForm address={sheet.address} onDone={closeSheet} />}
      </SideSheet>
    </div>
  )
}
