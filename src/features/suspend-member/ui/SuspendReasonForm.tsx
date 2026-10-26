import { useState, type FormEvent } from 'react'
import { REASON_MAX, validateReason } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'

type SuspendReasonFormProps = {
  /** 입력 칸 이름 (예: "정지 사유") */
  reasonLabel: string
  submitLabel: string
  pending: boolean
  error: string | null
  onSubmit: (reason: string) => void
  onCancel: () => void
}

/** 사유(필수 · 200자) → 실행. 여는 버튼은 화면이 줄 옆에 두고, 이 폼은 그 줄 아래에 펼친다 */
export function SuspendReasonForm({
  reasonLabel,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: SuspendReasonFormProps) {
  const [reason, setReason] = useState('')
  const invalid = validateReason(reason)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!invalid) onSubmit(reason.trim())
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={reasonLabel}
          placeholder={`${reasonLabel} (${REASON_MAX}자까지)`}
          className="h-10 min-w-48 flex-1 text-[15px]"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button type="submit" className="h-10 px-4" disabled={invalid !== null || pending}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" className="h-10 px-3" onClick={onCancel}>
          취소
        </Button>
      </div>
      {reason && invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {error && <StateMessage tone="error">{error}</StateMessage>}
    </form>
  )
}
