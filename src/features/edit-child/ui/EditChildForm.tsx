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
    <Card className="space-y-5 p-5 md:p-6">
      <div className="space-y-1">
        <CardTitle>정보 수정</CardTitle>
        <p className="text-muted-foreground text-[13px]">키를 바꾸면 성장 이력에 한 줄 쌓여요.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <ChildFormFields
          form={form}
          onChange={setForm}
          footer={
            <>
              <Button type="submit" className="h-11 px-6 text-[15px]" disabled={update.isPending}>
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
