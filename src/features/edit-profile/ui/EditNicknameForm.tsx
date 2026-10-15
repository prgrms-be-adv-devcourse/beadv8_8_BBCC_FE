import { useState, type FormEvent } from 'react'
import { NICKNAME_MAX, NICKNAME_MIN, validateNickname } from '@/entities/session'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useUpdateNickname } from '../model/use-edit-profile'

type EditNicknameFormProps = { current: string }

export function EditNicknameForm({ current }: EditNicknameFormProps) {
  const update = useUpdateNickname()
  const [nickname, setNickname] = useState(current)
  const invalid = validateNickname(nickname)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!invalid) update.mutate(nickname)
  }

  return (
    <form className="flex items-end gap-2" onSubmit={handleSubmit}>
      <Label className="flex-1">
        닉네임 ({NICKNAME_MIN}~{NICKNAME_MAX}자)
        <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </Label>
      <Button type="submit" disabled={invalid !== null || update.isPending}>
        닉네임 바꾸기
      </Button>
      {nickname && invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {update.isError && <StateMessage tone="error">{getErrorMessage(update.error)}</StateMessage>}
      {update.isSuccess && <StateMessage>바꿨어요. 토큰을 다시 받아 반영했어요.</StateMessage>}
    </form>
  )
}
