import { useState } from 'react'
import { REASON_MAX, validateReason } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/page-header'

type Props = {
  /** 처음 보이는 버튼 (예: "이용 정지") */
  openLabel: string
  /** 입력 칸 이름 (예: "정지 사유") */
  reasonLabel: string
  submitLabel: string
  pending: boolean
  error: string | null
  onSubmit: (reason: string) => void
}

/** 버튼 → 사유 입력(필수 · 200자) → 실행. 정지 · 거절처럼 사유가 필요한 관리자 동작 */
function ReasonForm({ openLabel, reasonLabel, submitLabel, pending, error, onSubmit }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const invalid = validateReason(reason)

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {openLabel}
      </Button>
    )
  }
  return (
    <div className="w-full space-y-1">
      <div className="flex items-center gap-2">
        <Input
          aria-label={reasonLabel}
          placeholder={`${reasonLabel} (${REASON_MAX}자까지)`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button
          size="sm"
          variant="destructive"
          disabled={invalid !== null || pending}
          onClick={() => onSubmit(reason.trim())}
        >
          {submitLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          취소
        </Button>
      </div>
      {reason && invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {error && <StateMessage tone="error">{error}</StateMessage>}
    </div>
  )
}

export { ReasonForm }
