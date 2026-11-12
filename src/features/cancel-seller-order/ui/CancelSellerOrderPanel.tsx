import { useState } from 'react'
import { canCancelSellerOrder, type SellerOrder } from '@/entities/seller-order'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { ChoiceGroup } from '@/shared/ui/ChoiceGroup'
import { Textarea } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import {
  CANCEL_MEMO_MAX,
  SELLER_CANCEL_REASONS,
  validateCancelMemo,
  type SellerCancelReason,
} from '../model/cancel-seller-order'
import { useCancelSellerOrder } from '../model/use-cancel-seller-order'

type CancelSellerOrderPanelProps = { sellerOrder: SellerOrder }

/** 판매자 발송 전 취소: 버튼 → 사유 · 메모 → 확인 창 → 요청. 발송 준비가 아니면 그리지 않는다 */
export function CancelSellerOrderPanel({ sellerOrder }: CancelSellerOrderPanelProps) {
  const { cancel, pending, error } = useCancelSellerOrder(sellerOrder.id)
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState<SellerCancelReason | null>(null)
  const [memo, setMemo] = useState('')
  if (!canCancelSellerOrder(sellerOrder)) return null
  const memoError = validateCancelMemo(memo)
  const count = sellerOrder.items.length

  async function handleCancel() {
    if (!reason) return
    const ok = await confirmAction({
      title: '발송 전에 취소할까요?',
      description: `이 주문의 내 상품 ${count}개가 모두 취소되고 구매자에게 환불돼요. 되돌릴 수 없어요.`,
      confirmLabel: '취소하기',
      tone: 'danger',
    })
    if (ok) cancel({ reason, memo })
  }

  if (!isOpen)
    return (
      <Button
        variant="destructive"
        className="h-10 rounded-md px-4 max-sm:h-11"
        onClick={() => setIsOpen(true)}
      >
        발송 전 취소
      </Button>
    )

  return (
    <div className="border-rule space-y-3 border-t border-dashed pt-4">
      <div className="space-y-1">
        <p className="font-semibold">이 주문의 내 상품 {count}개를 모두 취소해요</p>
        <p className="text-ink-2 text-sm">
          구매자에게 이 상품 값이 예치금으로 돌아가요. 되돌릴 수 없어요.
        </p>
      </div>
      <ChoiceGroup
        legend="취소 사유"
        name={`seller-cancel-${sellerOrder.id}`}
        options={SELLER_CANCEL_REASONS}
        value={reason}
        onChange={setReason}
        disabled={pending}
      />
      <label className="block space-y-1">
        <span className="text-ink-3 block text-[13px]">
          메모 (선택, {CANCEL_MEMO_MAX}자까지 · 구매자에게 보이지 않아요)
        </span>
        <Textarea
          className="bg-paper rounded-md"
          rows={2}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          disabled={pending}
        />
      </label>
      {memoError && <StateMessage tone="error">{memoError}</StateMessage>}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          className="h-10 rounded-md px-4"
          disabled={pending}
          onClick={() => setIsOpen(false)}
        >
          닫기
        </Button>
        <Button
          className="bg-destructive hover:bg-destructive/85 h-10 rounded-md px-4 text-white"
          disabled={pending || !reason || memoError !== null}
          onClick={handleCancel}
        >
          취소하기
        </Button>
      </div>
    </div>
  )
}
