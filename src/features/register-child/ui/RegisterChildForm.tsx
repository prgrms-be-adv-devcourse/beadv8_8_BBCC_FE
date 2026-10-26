import { useState, type FormEvent } from 'react'
import { ChildFormFields, validateChildForm, type ChildForm } from '@/entities/child'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { DEMO_CHILD } from '../config/demo-child'
import { useRegisterChild } from '../model/use-register-child'

type RegisterChildFormProps = {
  /** 등록한 뒤 (예: 목록으로 이동) */
  onRegistered?: () => void
}

/** 자녀 등록 폼 (제목 · 바탕은 부르는 화면이 갖는다) */
export function RegisterChildForm({ onRegistered }: RegisterChildFormProps) {
  const register = useRegisterChild()
  const [form, setForm] = useState<ChildForm>(DEMO_CHILD)
  const [invalid, setInvalid] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateChildForm(form, new Date().toISOString().slice(0, 10))
    setInvalid(message)
    if (!message) register.mutate(form, { onSuccess: () => onRegistered?.() })
  }

  return (
    <form onSubmit={handleSubmit}>
      <ChildFormFields
        form={form}
        onChange={setForm}
        footer={
          <>
            <Button type="submit" className="h-11 px-6 text-[15px]" disabled={register.isPending}>
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
  )
}
