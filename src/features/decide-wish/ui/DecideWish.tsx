import { useState } from 'react'
import { Link } from 'react-router'
import { WISH_REJECT_REASONS, wishRejectReasonLabel, type WishRequest } from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { canApproveWish, isApprovableLine, toWishApproval } from '../model/approval'
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
    if (await confirmAction({ title: '선택한 상품을 주문할까요?', confirmLabel: '승인' })) {
      approve.mutate(toWishApproval(lines, address), {
        onSuccess: (orderId) => {
          if (orderId) onApproved(orderId)
        },
      })
    }
  }
  async function handleReject() {
    if (await confirmAction({ title: '조르기를 거절할까요?', confirmLabel: '거절' }))
      reject.mutate(reason)
  }
  return (
    <section className="border-rule space-y-4 rounded-lg border p-4 md:p-5">
      <h2 className="text-section">조르기 답하기</h2>
      {wish.items.map((item) => (
        <div key={item.wishItemId}>
          <label>
            <input
              type="checkbox"
              disabled={!isApprovableLine(item) || pending}
              checked={isSelected(item.wishItemId)}
              onChange={() => toggle(item.wishItemId)}
            />{' '}
            {item.productName}
          </label>
          <label>
            {' '}
            수량{' '}
            <input
              type="number"
              min="1"
              max="99"
              value={quantityOf(item)}
              disabled={!isSelected(item.wishItemId) || pending}
              onChange={(event) => setQuantity(item.wishItemId, Number(event.target.value))}
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
          승인하고 주문
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
