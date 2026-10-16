import { useState, type FormEvent } from 'react'
import { ChildFormFields, validateChildForm, type ChildForm } from '@/entities/child'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/StateMessage'
import { DEMO_CHILD } from '../config/demo-child'
import { useRegisterChild } from '../model/use-register-child'

export function RegisterChildForm() {
  const register = useRegisterChild()
  const [form, setForm] = useState<ChildForm>(DEMO_CHILD)
  const [invalid, setInvalid] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateChildForm(form, new Date().toISOString().slice(0, 10))
    setInvalid(message)
    if (!message) register.mutate(form)
  }

  return (
    <Card>
      <CardTitle className="mb-3">자녀 등록</CardTitle>
      <form onSubmit={handleSubmit}>
        <ChildFormFields
          form={form}
          onChange={setForm}
          footer={
            <>
              <Button type="submit" disabled={register.isPending}>
                등록하기
              </Button>
              {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
              {register.isError && (
                <StateMessage tone="error">{getErrorMessage(register.error)}</StateMessage>
              )}
            </>
          }
        />
      </form>
    </Card>
  )
}
