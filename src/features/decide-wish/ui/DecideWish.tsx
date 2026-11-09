import { useState } from 'react'
import { Link } from 'react-router'
import { WISH_REJECT_REASONS, wishRejectReasonLabel, type WishRequest } from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { confirmAction, formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { canApproveWish, isApprovableLine, toWishOrder } from '../model/approval'
import { useDecideWish } from '../model/use-decide-wish'
import { useWishSelection } from '../model/use-wish-selection'

type DecideWishProps = {
  wish: WishRequest
  addressesPath: string
  onApproved: (orderId: string) => void
}
export function DecideWish({ wish, addressesPath, onApproved }: DecideWishProps) {
  const { addresses, isSelected, toggle, quantityOf, setQuantity, address, selectAddress, lines } =
    useWishSelection(wish)
  const { approve, reject, needsRecheck } = useDecideWish(wish)
  const [reason, setReason] = useState('TOO_EXPENSIVE')
  const pending = approve.isPending || reject.isPending
  const error = approve.error || reject.error || addresses.error
  async function handleApprove() {
    if (!address || !canApproveWish(lines, address)) return
    const total = lines.reduce((sum, line) => sum + (line.unitPrice ?? 0) * line.quantity, 0)
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
    <section className="border-rule space-y-4 rounded-lg border p-4 md:p-5">
      <h2 className="text-section">조르기 답하기</h2>
      {wish.items.map((item) => (
        <div key={item.optionId}>
          <label>
            <input
              type="checkbox"
              disabled={!isApprovableLine(item) || pending}
              checked={isSelected(item.optionId)}
              onChange={() => toggle(item.optionId)}
            />{' '}
            {item.productName} · {item.optionName} · 조른 수량 {item.quantity}개
          </label>
          <label>
            {' '}
            수량{' '}
            <input
              type="number"
              min="1"
              max={item.quantity}
              value={quantityOf(item)}
              disabled={!isSelected(item.optionId) || pending}
              onChange={(event) => setQuantity(item.optionId, Number(event.target.value))}
            />
          </label>
        </div>
      ))}
      {addresses.data?.length === 0 ? (
        <p>
          배송지를 먼저 등록해 주세요. <Link to={addressesPath}>배송지 관리</Link>
        </p>
      ) : (
        <label>
          배송지{' '}
          <select value={address?.id ?? ''} onChange={(event) => selectAddress(event.target.value)}>
            <option value="">배송지 선택</option>
            {addresses.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.recipientName} · {item.fullAddress}
              </option>
            ))}
          </select>
        </label>
      )}
      <div>
        <Button disabled={pending || !canApproveWish(lines, address)} onClick={handleApprove}>
          {approve.isPending ? '주문하는 중…' : '승인하고 결제'}
        </Button>
      </div>
      <label>
        거절 사유{' '}
        <select value={reason} onChange={(event) => setReason(event.target.value)}>
          {WISH_REJECT_REASONS.map((value) => (
            <option key={value} value={value}>
              {wishRejectReasonLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <div>
        <Button variant="outline" disabled={pending} onClick={handleReject}>
          거절
        </Button>
      </div>
      {error && (
        <StateMessage tone="error">
          {getErrorMessage(error)}
          {needsRecheck && ' 정보가 바뀌었어요. 다시 확인해 주세요.'}
        </StateMessage>
      )}
    </section>
  )
}
