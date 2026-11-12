import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  WISH_REJECT_REASONS,
  wishRejectReasonLabel,
  type WishRequest,
  type WishRequestLine,
} from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { cn, confirmAction, formatWon, optionLabel } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { canApproveWish, isApprovableLine, toWishOrder, wishOrderTotal } from '../model/approval'
import { useDecideWish } from '../model/use-decide-wish'
import { useWishSelection } from '../model/use-wish-selection'

type DecideWishProps = {
  wish: WishRequest
  addressesPath: string
  /** 상품 사진 (화면이 그려 넣는다) */
  renderImage: (line: WishRequestLine) => ReactNode
  onApproved: (orderId: string) => void
}

/** 조르기 답하기: 사 줄 상품(처음부터 모두 고름) · 수량 → 배송지 → 합계 · 결제 뒤 잔액 → 승인하고 결제. 거절은 접어 둔다 */
export function DecideWish({ wish, addressesPath, renderImage, onApproved }: DecideWishProps) {
  const selection = useWishSelection(wish)
  const { addresses, isSelected, toggle, quantityOf, setQuantity, address, selectAddress, lines } =
    selection
  const { approve, reject, needsRecheck } = useDecideWish(wish)
  const [reason, setReason] = useState('TOO_EXPENSIVE')
  const pending = approve.isPending || reject.isPending
  const error = approve.error || reject.error || addresses.error
  const total = wishOrderTotal(lines)
  const after = selection.balance === null ? null : selection.balance - total

  async function handleApprove() {
    if (!address || !canApproveWish(lines, address)) return
    const isConfirmed = await confirmAction({
      title: '선택한 상품을 주문하고 결제할까요?',
      description: `예치금에서 ${formatWon(total)}이 결제돼요. 잔액이 부족하면 주문이 취소돼요.`,
      confirmLabel: '승인',
    })
    if (isConfirmed)
      approve.mutate(toWishOrder(wish.childId, lines, address), { onSuccess: onApproved })
  }
  async function handleReject() {
    if (await confirmAction({ title: '조르기를 거절할까요?', confirmLabel: '거절' }))
      reject.mutate(reason)
  }

  return (
    <section
      aria-label="조르기 답하기"
      className="border-rule space-y-4 rounded-lg border p-4 md:p-5"
    >
      <h2 className="text-section">조르기 답하기</h2>
      {selection.approvableCount > 0 && (
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="accent-signal size-5"
            checked={selection.isAllSelected}
            disabled={pending}
            onChange={selection.toggleAll}
          />
          모두 사 주기 ({lines.length}/{selection.approvableCount})
        </label>
      )}
      <ul className="space-y-3">
        {wish.items.map((item) => {
          const approvable = isApprovableLine(item)
          const option = optionLabel(item)
          return (
            <li
              key={item.optionId}
              className="border-rule flex flex-wrap items-start gap-3 rounded-lg border p-3"
            >
              <input
                type="checkbox"
                className="accent-signal mt-1 size-5 shrink-0"
                aria-label={`${item.productName} 사 주기`}
                disabled={!approvable || pending}
                checked={isSelected(item.optionId)}
                onChange={() => toggle(item.optionId)}
              />
              <span className="rounded-card block aspect-square w-20 shrink-0 overflow-hidden">
                {renderImage(item)}
              </span>
              <div className="min-w-0 flex-1 basis-40 space-y-0.5">
                {item.sellerName && <p className="text-ink-3 text-xs">{item.sellerName}</p>}
                <p className="text-[15px] font-semibold">{item.productName}</p>
                {option && <p className="text-ink-2 text-[13px]">{option}</p>}
                <p className="text-ink-2 figure text-[13px]">
                  {item.unitPrice === null ? '가격 확인 필요' : formatWon(item.unitPrice)} × 조른
                  수량 {item.quantity}
                </p>
                <p
                  className={cn(
                    'text-xs font-semibold',
                    approvable ? 'text-ink-3' : 'text-destructive',
                  )}
                >
                  {approvable ? '판매 중' : '지금은 살 수 없어요'}
                </p>
                <label className="flex items-center gap-2 pt-1 text-[13px]">
                  수량
                  <input
                    type="number"
                    min="1"
                    max={item.quantity}
                    value={quantityOf(item)}
                    disabled={!isSelected(item.optionId) || pending}
                    onChange={(event) => setQuantity(item.optionId, Number(event.target.value))}
                    className="border-field-edge figure h-9 w-16 rounded-md border px-2"
                  />
                </label>
              </div>
            </li>
          )
        })}
      </ul>
      {addresses.data?.length === 0 ? (
        <p className="text-sm">
          배송지를 먼저 등록해 주세요.{' '}
          <Link to={addressesPath} className="shop-link">
            배송지 관리
          </Link>
        </p>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="wish-address" className="text-sm font-semibold">
            배송지
          </label>
          <select
            id="wish-address"
            className="border-field-edge h-11 w-full rounded-md border px-3 text-sm"
            value={address?.id ?? ''}
            onChange={(event) => selectAddress(event.target.value)}
          >
            <option value="">배송지 선택</option>
            {addresses.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.recipientName} · {item.fullAddress}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="border-rule space-y-1 border-t pt-3 text-sm">
        <p className="flex justify-between">
          <span>고른 상품 {lines.length}개</span>
          <strong className="figure">{formatWon(total)}</strong>
        </p>
        {selection.balance !== null && after !== null && (
          <p className={cn('flex justify-between', after < 0 ? 'text-destructive' : 'text-ink-2')}>
            <span>내 예치금</span>
            <span className="figure">
              {formatWon(selection.balance)} → 결제 뒤{' '}
              {after < 0 ? `${formatWon(-after)} 모자라요` : formatWon(after)}
            </span>
          </p>
        )}
      </div>
      <button
        type="button"
        className="shop-btn w-full"
        disabled={pending || !canApproveWish(lines, address)}
        aria-busy={approve.isPending}
        onClick={handleApprove}
      >
        {approve.isPending
          ? '주문하는 중…'
          : lines.length
            ? `${formatWon(total)} 승인하고 결제`
            : '사 줄 상품을 골라 주세요'}
      </button>
      <details className="border-rule rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-semibold">거절하기</summary>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span className="block">거절 사유</span>
            <select
              className="border-field-edge h-10 rounded-md border px-3"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              {WISH_REJECT_REASONS.map((value) => (
                <option key={value} value={value}>
                  {wishRejectReasonLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" className="h-10" disabled={pending} onClick={handleReject}>
            거절
          </Button>
        </div>
      </details>
      {error && (
        <StateMessage tone="error">
          {getErrorMessage(error)}
          {needsRecheck && ' 정보가 바뀌었어요. 다시 확인해 주세요.'}
        </StateMessage>
      )}
    </section>
  )
}
