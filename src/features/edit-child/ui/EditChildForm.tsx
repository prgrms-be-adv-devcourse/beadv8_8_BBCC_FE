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
import { StateMessage } from '@/shared/ui/page-header'
import { useUpdateChild } from '../model/use-edit-child'

export function EditChildForm({ child }: { child: Child }) {
  const update = useUpdateChild(child.id)
  const [form, setForm] = useState<ChildForm>(() => toChildForm(child))
  const [invalid, setInvalid] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateChildForm(form, new Date().toISOString().slice(0, 10))
    setInvalid(message)
    if (!message) update.mutate(form)
  }

  return (
    <Card>
      <CardTitle className="mb-3">정보 수정</CardTitle>
      <form onSubmit={submit}>
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
              {update.isSuccess && (
                <StateMessage>저장했어요. 키 · 체형이 바뀌었으면 성장 이력에 쌓여요.</StateMessage>
              )}
            </>
          }
        />
      </form>
    </Card>
  )
}
