import { useState, type FormEvent } from 'react'
import {
  canRegisterChild,
  ChildFormFields,
  validateChildForm,
  type ChildForm,
} from '@/entities/child'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useDemoRoleSwitch } from '@/shared/config'
import { DEMO_CHILD, EMPTY_CHILD } from '../config/demo-child'
import { useRegisterChild } from '../model/use-register-child'

const withoutOptional = (form: ChildForm): ChildForm => ({
  ...form,
  bodyType: null,
  preferredFit: null,
})

type RegisterChildFormProps = {
  /** 등록한 뒤 (예: 목록으로 이동) */
  onRegistered?: () => void
}

/** 자녀 등록 폼 (제목 · 바탕은 부르는 화면이 갖는다) */
export function RegisterChildForm({ onRegistered }: RegisterChildFormProps) {
  const register = useRegisterChild()
  // 시연 기능이 켜졌을 때만 예시 자녀로 채운다
  const demoRoleSwitch = useDemoRoleSwitch()
  const [form, setForm] = useState<ChildForm>(() =>
    demoRoleSwitch ? withoutOptional(DEMO_CHILD) : EMPTY_CHILD,
  )
  const [invalid, setInvalid] = useState<string | null>(null)
  const [requiredConsent, setRequiredConsent] = useState(false)
  const [optionalConsent, setOptionalConsent] = useState(false)
  const isTooOld = !!form.birthDate && !canRegisterChild(form.birthDate)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateChildForm(form, new Date().toISOString().slice(0, 10))
    setInvalid(message)
    if (!message) register.mutate({ form, optionalConsent }, { onSuccess: () => onRegistered?.() })
  }

  return (
    <form onSubmit={handleSubmit}>
      <ChildFormFields
        form={form}
        onChange={setForm}
        isOptionalDisabled={!optionalConsent}
        footer={
          <>
            <label className="flex basis-full items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-signal mt-0.5 size-4 shrink-0"
                checked={requiredConsent}
                onChange={(e) => setRequiredConsent(e.target.checked)}
              />
              필수 동의: 이름 · 생년월일 · 성별 · 키 · 몸무게를 자녀 사이즈 맞춤 상품 추천과 주문에
              사용해요. 자녀 정보를 삭제할 때까지 보관하며, 거부하면 자녀를 등록할 수 없어요.
            </label>
            <label className="flex basis-full items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-signal mt-0.5 size-4 shrink-0"
                checked={optionalConsent}
                onChange={(e) => {
                  setOptionalConsent(e.target.checked)
                  if (!e.target.checked) setForm(withoutOptional)
                }}
              />
              선택 동의: 체형 · 선호 핏을 맞춤 추천에 사용해요. 자녀 정보를 삭제할 때까지 보관하며,
              거부하면 체형 · 선호 핏을 입력할 수 없어요.
            </label>
            {isTooOld && (
              <div className="basis-full">
                <StateMessage tone="error">만 14세 이상 자녀는 아직 등록할 수 없어요.</StateMessage>
              </div>
            )}
            <Button
              type="submit"
              className="h-11 px-6 text-[15px]"
              disabled={register.isPending || !requiredConsent || isTooOld}
            >
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
