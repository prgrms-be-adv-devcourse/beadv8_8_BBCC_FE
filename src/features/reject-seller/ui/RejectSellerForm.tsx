import { useState, type FormEvent } from 'react'
import { REJECT_REASON_MAX, validateRejectReason } from '@/entities/seller'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useRejectSeller } from '../model/use-reject-seller'

type RejectSellerFormProps = {
  applicationId: string
  /** 「취소」를 누르면 (여는 버튼 · 열림 상태는 화면이 가진다) */
  onCancel: () => void
}

/** 거절 사유 입력 → 거절하기 (사유는 신청한 회원에게 그대로 보인다) */
export function RejectSellerForm({ applicationId, onCancel }: RejectSellerFormProps) {
  const reject = useRejectSeller()
  const [reason, setReason] = useState('')
  const invalid = validateRejectReason(reason)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!invalid) reject.mutate({ applicationId, reason })
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="거절 사유"
          placeholder={`거절 사유 (${REJECT_REASON_MAX}자까지, 신청자에게 보여요)`}
          className="h-10 min-w-48 flex-1 text-[15px]"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button
          type="submit"
          variant="outline"
          className="h-10 px-4"
          disabled={invalid !== null || reject.isPending}
        >
          거절하기
        </Button>
        <Button type="button" variant="ghost" className="h-10 px-3" onClick={onCancel}>
          취소
        </Button>
      </div>
      {reason && invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {reject.isError && <StateMessage tone="error">{getErrorMessage(reject.error)}</StateMessage>}
    </form>
  )
}
