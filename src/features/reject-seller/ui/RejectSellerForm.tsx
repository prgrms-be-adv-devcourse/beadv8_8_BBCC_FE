import { useState } from 'react'
import { REJECT_REASON_MAX, validateRejectReason } from '@/entities/seller'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/page-header'
import { useRejectSeller } from '../model/use-reject-seller'

/** 거절 버튼 → 사유 입력 → 거절하기 (사유는 신청한 회원에게 그대로 보인다) */
export function RejectSellerForm({ applicationId }: { applicationId: string }) {
  const reject = useRejectSeller()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const invalid = validateRejectReason(reason)

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        거절
      </Button>
    )
  }
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <Input
          aria-label="거절 사유"
          placeholder={`거절 사유 (${REJECT_REASON_MAX}자까지, 신청자에게 보여요)`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button
          size="sm"
          variant="destructive"
          disabled={invalid !== null || reject.isPending}
          onClick={() => reject.mutate({ applicationId, reason })}
        >
          거절하기
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          취소
        </Button>
      </div>
      {reason && invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {reject.isError && <StateMessage tone="error">{getErrorMessage(reject.error)}</StateMessage>}
    </div>
  )
}
