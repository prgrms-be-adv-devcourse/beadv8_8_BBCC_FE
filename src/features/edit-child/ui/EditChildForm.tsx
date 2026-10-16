import { useState, type FormEvent } from 'react'
import {
  ChildFormFields,
  toChildForm,
  validateChildForm,
  type Child,
  type ChildForm,
} from '@/entities/child'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useUpdateChild } from '../model/use-edit-child'

type EditChildFormProps = { child: Child }

export function EditChildForm({ child }: EditChildFormProps) {
  const update = useUpdateChild(child.id)
  const [form, setForm] = useState<ChildForm>(() => toChildForm(child))
  const [invalid, setInvalid] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateChildForm(form, new Date().toISOString().slice(0, 10))
    setInvalid(message)
    if (!message) update.mutate(form)
  }

  return (
    <Card>
      <CardTitle className="mb-3">정보 수정</CardTitle>
      <form onSubmit={handleSubmit}>
        <ChildFormFields
          form={form}
          onChange={setForm}
          footer={
            <>
              <Button type="submit" disabled={update.isPending}>
                저장하기
              </Button>
              {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
              {update.isError && (
                <StateMessage tone="error">{getErrorMessage(update.error)}</StateMessage>
              )}
            </>
          }
        />
      </form>
    </Card>
  )
}
