import { useState, type FormEvent } from 'react'
import { BUSINESS_NAME_MAX, validateBusinessName } from '@/entities/seller'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useUpdateBusinessName } from '../model/use-edit-seller-info'
import { MockBadge } from '@/shared/ui/MockBadge'

type EditBusinessNameFormProps = { current: string; onDone: () => void }

export function EditBusinessNameForm({ current, onDone }: EditBusinessNameFormProps) {
  const update = useUpdateBusinessName()
  const [name, setName] = useState(current)
  const invalid = validateBusinessName(name)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!invalid) update.mutate(name, { onSuccess: onDone })
  }

  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={handleSubmit}>
      <Input
        aria-label="상호명"
        className="w-60"
        maxLength={BUSINESS_NAME_MAX + 10}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={invalid !== null || update.isPending}>
        상호명 저장
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onDone}>
        취소
      </Button>
      {name && invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {update.isError && <StateMessage tone="error">{getErrorMessage(update.error)}</StateMessage>}
      <MockBadge endpoints={['PATCH /seller/me']} />
    </form>
  )
}
