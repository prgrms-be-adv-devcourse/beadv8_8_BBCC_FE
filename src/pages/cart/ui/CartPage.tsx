import { useState } from 'react'
import { Link } from 'react-router'
import { useAddressesQuery } from '@/entities/address'
import { useCartQuery } from '@/entities/cart'
import { useChildrenQuery } from '@/entities/child'
import { useWalletQuery } from '@/entities/wallet'
import { CartItemControls } from '@/features/edit-cart-item'
import { PlaceOrderButton } from '@/features/place-order'
import { getErrorMessage } from '@/shared/api'
import { formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Card, CardTitle } from '@/shared/ui/card'
import { Select } from '@/shared/ui/input'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

/** 장바구니 + 주문서 (배송지 선택 · 잔액 확인 · 주문하기) */
export function CartPage() {
  const cart = useCartQuery()
  const addresses = useAddressesQuery()
  const wallet = useWalletQuery()
  const children = useChildrenQuery()
  const [addressId, setAddressId] = useState<number | null>(null)

  const purchasable = cart.data?.items.filter((line) => line.purchasable) ?? []
  const orderAmount = purchasable.reduce((sum, line) => sum + line.lineAmount, 0)
  const address =
    addresses.data?.find((item) => item.id === addressId) ??
    addresses.data?.find((item) => item.isDefault) ??
    null
  const childName = (childId: string | null) =>
    children.data?.find((child) => String(child.id) === childId)?.name

  return (
    <div className="space-y-4">
      <PageHeader
        title="④ 장바구니 · 주문"
        description="담을 때 고른 자녀가 주문상품에 함께 남아요."
      />

      {cart.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {cart.isError && <StateMessage tone="error">{getErrorMessage(cart.error)}</StateMessage>}
      {cart.data?.items.length === 0 && (
        <StateMessage>
          장바구니가 비었어요.{' '}
          <Link to="/products" className="text-primary underline">
            상품 보러 가기
          </Link>
        </StateMessage>
      )}
      {cart.data?.items.map((line) => (
        <Card key={line.cartItemId} className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">
              {line.productName} · {line.size}{' '}
              {!line.purchasable && <Badge variant="destructive">구매 불가</Badge>}
            </p>
            <p className="text-muted-foreground text-sm">
              {line.unitPrice !== null ? formatWon(line.unitPrice) : '-'} × {line.quantity} ={' '}
              {formatWon(line.lineAmount)}
              {line.childId && ` · 입을 자녀 ${childName(line.childId) ?? `#${line.childId}`}`}
            </p>
          </div>
          <CartItemControls line={line} />
        </Card>
      ))}

      {purchasable.length > 0 && (
        <Card className="space-y-3">
          <CardTitle>주문서</CardTitle>
          <div className="space-y-1">
            <p className="text-sm font-medium">배송지</p>
            {addresses.data?.length === 0 ? (
              <Link to="/addresses" className="text-primary text-sm underline">
                배송지를 먼저 등록해 주세요
              </Link>
            ) : (
              <Select
                value={address?.id ?? ''}
                onChange={(e) => setAddressId(Number(e.target.value))}
              >
                {addresses.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.recipientName} · {item.roadAddress} {item.isDefault ? '(기본)' : ''}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div className="flex justify-between text-sm">
            <span>예치금 잔액</span>
            <span>
              {wallet.data
                ? formatWon(wallet.data.balance)
                : wallet.isError
                  ? getErrorMessage(wallet.error)
                  : '…'}
            </span>
          </div>
          {wallet.data && wallet.data.balance < orderAmount && (
            <StateMessage tone="error">
              잔액이 {formatWon(orderAmount - wallet.data.balance)} 부족해요. 주문하면 결제 실패로
              취소돼요.{' '}
              <Link to="/wallet" className="underline">
                충전하기
              </Link>
            </StateMessage>
          )}
          <PlaceOrderButton lines={purchasable} address={address} totalAmount={orderAmount} />
        </Card>
      )}
    </div>
  )
}
