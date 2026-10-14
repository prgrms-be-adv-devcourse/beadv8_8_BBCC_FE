import { useState, type FormEvent } from 'react'
import {
  BODY_TYPE_LABEL,
  PREFERRED_FIT_LABEL,
  validateChildForm,
  type BodyType,
  type ChildForm,
  type Gender,
  type PreferredFit,
} from '@/entities/child'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/page-header'
import { DEMO_CHILD } from '../config/demo-child'
import { useRegisterChild } from '../model/use-register-child'

export function RegisterChildForm() {
  const register = useRegisterChild()
  const [form, setForm] = useState<ChildForm>(DEMO_CHILD)
  const [invalid, setInvalid] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateChildForm(form, new Date().toISOString().slice(0, 10))
    setInvalid(message)
    if (!message) register.mutate(form)
  }

  const set = <K extends keyof ChildForm>(key: K, value: ChildForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Card>
      <CardTitle className="mb-3">자녀 등록</CardTitle>
      <form className="grid grid-cols-2 gap-3" onSubmit={submit}>
        <Label>
          이름
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Label>
        <Label>
          생년월일
          <Input
            type="date"
            value={form.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
          />
        </Label>
        <Label>
          성별
          <Select value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)}>
            <option value="MALE">남</option>
            <option value="FEMALE">여</option>
          </Select>
        </Label>
        <Label>
          키 (cm)
          <Input
            type="number"
            step="0.1"
            value={form.heightCm}
            onChange={(e) => set('heightCm', Number(e.target.value))}
          />
        </Label>
        <Label>
          몸무게 (kg)
          <Input
            type="number"
            step="0.1"
            value={form.weightKg}
            onChange={(e) => set('weightKg', Number(e.target.value))}
          />
        </Label>
        <Label>
          체형 (선택)
          <Select
            value={form.bodyType ?? ''}
            onChange={(e) => set('bodyType', (e.target.value || null) as BodyType | null)}
          >
            <option value="">입력 안 함</option>
            {Object.entries(BODY_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Label>
        <Label>
          선호 핏 (선택)
          <Select
            value={form.preferredFit ?? ''}
            onChange={(e) => set('preferredFit', (e.target.value || null) as PreferredFit | null)}
          >
            <option value="">입력 안 함</option>
            {Object.entries(PREFERRED_FIT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Label>
        <div className="col-span-2 flex items-center gap-3">
          <Button type="submit" disabled={register.isPending}>
            등록하기
          </Button>
          {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
          {register.isError && (
            <StateMessage tone="error">{getErrorMessage(register.error)}</StateMessage>
          )}
          {register.isSuccess && <StateMessage>등록했어요.</StateMessage>}
        </div>
      </form>
    </Card>
  )
}
