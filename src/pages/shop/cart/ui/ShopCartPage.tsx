import { Link, useNavigate } from 'react-router'
import { orderableLines } from '@/entities/cart'
import { findChild, useChildrenQuery } from '@/entities/child'
import { ProductImage } from '@/entities/product'
import { CartItemControls } from '@/features/edit-cart-item'
import { PlaceOrderButton, useCheckout } from '@/features/place-order'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Card, CardTitle } from '@/shared/ui/card'
import { Select } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 장바구니 + 주문서: 주문할 상품 선택 → 배송지 · 예치금 잔액 확인 → 주문하기 (기획서 F05 · F06) */
export function ShopCartPage() {
  const navigate = useNavigate()
  const {
    cart,
    addresses,
    wallet,
    lines,
    orderAmount,
    address,
    selectAddress,
    shortage,
    chargeAmount,
    isSelected,
    toggleLine,
    allSelected,
    toggleAll,
  } = useCheckout()
  const children = useChildrenQuery()
  const orderableIds = new Set(cart.data ? orderableLines(cart.data).map((line) => line.id) : [])
  const chargeHref =
    chargeAmount === null
      ? paths.shop.wallet
      : `${paths.shop.wallet}?amount=${chargeAmount}&return=${encodeURIComponent(paths.shop.cart)}`

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">장바구니</h1>
      {cart.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {cart.isError && <StateMessage tone="error">{getErrorMessage(cart.error)}</StateMessage>}
      {cart.data?.lines.length === 0 && (
        <Card className="py-10 text-center">
          <p className="text-muted-foreground">장바구니가 비었어요.</p>
          <Link to={paths.shop.home} className="text-primary mt-2 inline-block underline">
            상품 보러 가기
          </Link>
        </Card>
      )}

      {cart.data && cart.data.lines.length > 0 && (
        <div className="grid items-start gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="accent-primary size-4"
                checked={allSelected}
                disabled={orderableIds.size === 0}
                onChange={toggleAll}
              />
              전체 선택 ({lines.length}/{orderableIds.size})
            </label>
            {cart.data.lines.map((line) => (
              <Card
                key={line.id}
                className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4"
              >
                <input
                  type="checkbox"
                  className="accent-primary size-4 shrink-0"
                  aria-label={`${line.productName} ${line.size} 주문하기`}
                  checked={orderableIds.has(line.id) && isSelected(line.id)}
                  disabled={!orderableIds.has(line.id)}
                  onChange={() => toggleLine(line.id)}
                />
                <ProductImage
                  src={null}
                  alt={line.productName}
                  className="size-16 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-medium">
                    {line.productName}{' '}
                    {!line.purchasable && <Badge variant="destructive">구매 불가</Badge>}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    사이즈 {line.size}
                    {line.childId &&
                      ` · ${findChild(children.data, line.childId)?.name ?? `자녀 #${line.childId}`}가 입어요`}
                  </p>
                  <p className="text-sm font-semibold">{formatWon(line.lineAmount)}</p>
                </div>
                <div className="ml-auto">
                  <CartItemControls line={line} />
                </div>
              </Card>
            ))}
          </div>

          <Card className="space-y-4 md:sticky md:top-4">
            <CardTitle>주문서</CardTitle>
            <div className="space-y-1">
              <p className="text-sm font-medium">배송지</p>
              {addresses.data?.length === 0 ? (
                <Link to={paths.shop.addresses} className="text-primary text-sm underline">
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
            <div className="space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span>선택한 상품 {lines.length}개</span>
                <span>{formatWon(orderAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>결제 수단</span>
                <span>예치금</span>
              </div>
              <div className="text-muted-foreground flex justify-between">
                <span>예치금 잔액</span>
                <span>
                  {wallet.data
                    ? formatWon(wallet.data.balance)
                    : wallet.isError
                      ? getErrorMessage(wallet.error)
                      : '…'}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>결제 금액</span>
                <span>{formatWon(orderAmount)}</span>
              </div>
            </div>
            {shortage > 0 && (
              <StateMessage tone="error">
                잔액이 {formatWon(shortage)} 부족해요. 이대로 주문하면 결제에 실패해요.{' '}
                <Link to={chargeHref} className="font-semibold underline">
                  {chargeAmount === null
                    ? '충전하기'
                    : `${formatWon(chargeAmount)} 충전하고 돌아오기`}
                </Link>
              </StateMessage>
            )}
            <PlaceOrderButton
              lines={lines}
              address={address}
              totalAmount={orderAmount}
              onPlaced={(order) => navigate(paths.shop.order(order.id))}
            />
          </Card>
        </div>
      )}
    </div>
  )
}
