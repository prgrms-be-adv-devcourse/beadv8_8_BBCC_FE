import { Link, useNavigate } from 'react-router'
import { groupBySeller, orderableLines, sellerGroupLabel, sumLineAmount } from '@/entities/cart'
import { findChild, useChildrenQuery } from '@/entities/child'
import { ProductImage } from '@/entities/product'
import { CartItemControls, RemoveSelectedButton } from '@/features/edit-cart-item'
import { PlaceOrderButton, useCheckout } from '@/features/place-order'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatWon, optionLabel } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Select } from '@/shared/ui/input'
import { ListSkeleton } from '@/shared/ui/Skeleton'
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
    <div className="shop-look space-y-6">
      <h1 className="text-page">장바구니</h1>
      {cart.isPending && <ListSkeleton />}
      {cart.isError && <StateMessage tone="error">{getErrorMessage(cart.error)}</StateMessage>}
      {cart.data?.lines.length === 0 && (
        <div className="bg-paper-2 rounded-card space-y-3 py-16 text-center">
          <p className="text-ink-2 text-base">장바구니가 비었어요.</p>
          <Link to={paths.shop.home} className="shop-link">
            상품 보러 가기
          </Link>
        </div>
      )}

      {cart.data && cart.data.lines.length > 0 && (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex min-h-11 items-center gap-3 font-semibold">
                <input
                  type="checkbox"
                  className="accent-signal size-5"
                  checked={allSelected}
                  disabled={orderableIds.size === 0}
                  onChange={toggleAll}
                />
                전체 선택 ({lines.length}/{orderableIds.size})
              </label>
              <RemoveSelectedButton cartItemIds={lines.map((line) => line.id)} />
            </div>
            {groupBySeller(cart.data.lines).map((group) => (
              <section
                key={group.sellerId ?? 'unknown'}
                aria-label={sellerGroupLabel(group)}
                className="border-rule rounded-card border"
              >
                {/* 상점 묶음 머리: 상점 이름 · 담은 수 · 합계 */}
                <div className="border-rule flex items-baseline justify-between gap-4 border-b px-4 py-3">
                  <span className="text-[15px] font-bold">{sellerGroupLabel(group)}</span>
                  <span className="text-ink-3 figure flex gap-3 text-[13px]">
                    <span>{group.lines.length}개</span>
                    <span className="text-ink font-semibold">
                      {formatWon(sumLineAmount(group.lines))}
                    </span>
                  </span>
                </div>
                <ul className="divide-rule divide-y px-4">
                  {group.lines.map((line) => (
                    <li
                      key={line.id}
                      className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap"
                    >
                      <input
                        type="checkbox"
                        className="accent-signal size-5 shrink-0"
                        aria-label={`${line.productName} ${optionLabel(line) ?? ''} 주문하기`}
                        checked={orderableIds.has(line.id) && isSelected(line.id)}
                        disabled={!orderableIds.has(line.id)}
                        onChange={() => toggleLine(line.id)}
                      />
                      <ProductImage
                        src={null}
                        alt={line.productName}
                        className="rounded-card aspect-[3/4] w-16 shrink-0"
                      />
                      <div className="min-w-0 flex-1 basis-48 space-y-1">
                        <p className="text-sm font-semibold">
                          {line.productName}{' '}
                          {!line.purchasable && <Badge variant="destructive">구매 불가</Badge>}
                        </p>
                        <p className="text-ink-3 flex flex-wrap gap-x-3 text-[13px]">
                          {[
                            optionLabel(line),
                            line.childId &&
                              `${findChild(children.data, line.childId)?.name ?? `자녀 #${line.childId}`}가 입어요`,
                          ]
                            .filter(Boolean)
                            .map((text) => (
                              <span key={String(text)}>{text}</span>
                            ))}
                        </p>
                        <p className="figure text-[15px] font-bold">{formatWon(line.lineAmount)}</p>
                      </div>
                      <div className="ml-auto">
                        <CartItemControls line={line} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <aside className="bg-paper-2 rounded-card space-y-5 p-5 lg:sticky lg:top-32">
            <h2 className="text-lg font-bold">주문서</h2>
            <div className="space-y-2">
              <p className="text-ink-2 text-sm">배송지</p>
              {addresses.data?.length === 0 ? (
                <Link to={paths.shop.addresses} className="shop-link text-sm">
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
            <div className="border-rule figure space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span>선택한 상품 {lines.length}개</span>
                <span>{formatWon(orderAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>결제 수단</span>
                <span>예치금</span>
              </div>
              <div className="text-ink-2 flex justify-between">
                <span>예치금 잔액</span>
                <span>
                  {wallet.data
                    ? formatWon(wallet.data.balance)
                    : wallet.isError
                      ? getErrorMessage(wallet.error)
                      : '…'}
                </span>
              </div>
              <div className="border-rule flex items-baseline justify-between border-t pt-3">
                <span className="text-base font-semibold">결제 금액</span>
                <span className="text-signal figure text-lg font-bold">
                  {formatWon(orderAmount)}
                </span>
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
          </aside>
        </div>
      )}
    </div>
  )
}
