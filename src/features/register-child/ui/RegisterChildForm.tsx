import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import {
  BODY_TYPE_LABEL,
  childKeys,
  PREFERRED_FIT_LABEL,
  type BodyType,
  type ChildProfileRequest,
  type Gender,
  type PreferredFit,
} from '@/entities/child'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/page-header'

// 기획서 7.1 시연 자녀 1
const INITIAL: ChildProfileRequest = {
  name: '테스트',
  birthDate: '2019-01-01',
  gender: 'MALE',
  heightCm: 115.0,
  weightKg: 20.0,
  bodyType: 'NORMAL',
  preferredFit: 'LOOSE',
}

/** 서버 검증과 같은 규칙을 먼저 확인한다 (서버 400 문구에는 필드명이 섞여 온다) */
function validate(form: ChildProfileRequest): string | null {
  if (!form.name.trim()) return '이름을 입력해 주세요.'
  if (!form.birthDate || form.birthDate > new Date().toISOString().slice(0, 10))
    return '생년월일은 오늘이나 그 전이어야 해요.'
  if (!(form.heightCm >= 40 && form.heightCm <= 200)) return '키는 40~200cm 사이로 입력해 주세요.'
  if (!(form.weightKg >= 2 && form.weightKg <= 150)) return '몸무게는 2~150kg 사이로 입력해 주세요.'
  const oneDecimal = (value: number) => Math.round(value * 10) === value * 10
  if (!oneDecimal(form.heightCm) || !oneDecimal(form.weightKg))
    return '키 · 몸무게는 소수 첫째 자리까지만 입력할 수 있어요.'
  return null
}

export function RegisterChildForm() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ChildProfileRequest>(INITIAL)
  const [invalid, setInvalid] = useState<string | null>(null)

  const register = useMutation({
    mutationFn: (request: ChildProfileRequest) =>
      runWithAction('자녀 등록', () => apiClient.post('/children', request)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: childKeys.all }),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message = validate(form)
    setInvalid(message)
    if (!message) register.mutate(form)
  }

  const set = <K extends keyof ChildProfileRequest>(key: K, value: ChildProfileRequest[K]) =>
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
