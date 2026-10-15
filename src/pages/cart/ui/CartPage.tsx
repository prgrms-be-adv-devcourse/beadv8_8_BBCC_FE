import { Link, useNavigate } from 'react-router'
import { findChild, useChildrenQuery } from '@/entities/child'
import { CartItemControls } from '@/features/edit-cart-item'
import { PlaceOrderButton, useCheckout } from '@/features/place-order'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Card, CardTitle } from '@/shared/ui/card'
import { Select } from '@/shared/ui/input'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

/** 장바구니 + 주문서 (배송지 선택 · 잔액 확인 · 주문하기) */
export function CartPage() {
  const navigate = useNavigate()
  const { cart, addresses, wallet, lines, orderAmount, address, selectAddress, shortage } =
    useCheckout()
  const children = useChildrenQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="장바구니 · 주문"
        step="④"
        note="담을 때 고른 자녀가 주문상품에 함께 남아요."
      />

      {cart.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {cart.isError && <StateMessage tone="error">{getErrorMessage(cart.error)}</StateMessage>}
      {cart.data?.lines.length === 0 && (
        <StateMessage>
          장바구니가 비었어요.{' '}
          <Link to={paths.console.products} className="text-primary underline">
            상품 보러 가기
          </Link>
        </StateMessage>
      )}
      {cart.data?.lines.map((line) => (
        <Card key={line.id} className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">
              {line.productName} · {line.size}{' '}
              {!line.purchasable && <Badge variant="destructive">구매 불가</Badge>}
            </p>
            <p className="text-muted-foreground text-sm">
              {line.unitPrice !== null ? formatWon(line.unitPrice) : '-'} × {line.quantity} ={' '}
              {formatWon(line.lineAmount)}
              {line.childId &&
                ` · 입을 자녀 ${findChild(children.data, line.childId)?.name ?? `#${line.childId}`}`}
            </p>
          </div>
          <CartItemControls line={line} />
        </Card>
      ))}

      {lines.length > 0 && (
        <Card className="space-y-3">
          <CardTitle>주문서</CardTitle>
          <div className="space-y-1">
            <p className="text-sm font-medium">배송지</p>
            {addresses.data?.length === 0 ? (
              <Link to={paths.console.addresses} className="text-primary text-sm underline">
                배송지를 먼저 등록해 주세요
              </Link>
            ) : (
              <Select value={address?.id ?? ''} onChange={(e) => selectAddress(e.target.value)}>
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
          {shortage > 0 && (
            <StateMessage tone="error">
              잔액이 {formatWon(shortage)} 부족해요. 주문하면 결제 실패로 취소돼요.{' '}
              <Link to={paths.console.wallet} className="underline">
                충전하기
              </Link>
            </StateMessage>
          )}
          <PlaceOrderButton
            lines={lines}
            address={address}
            totalAmount={orderAmount}
            onPlaced={(order) => navigate(paths.console.order(order.id))}
          />
        </Card>
      )}
    </div>
  )
}
