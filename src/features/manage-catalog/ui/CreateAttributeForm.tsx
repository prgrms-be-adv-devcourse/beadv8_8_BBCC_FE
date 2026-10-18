import { useState, type FormEvent } from 'react'
import {
  ATTRIBUTE_INPUT_TYPE_LABEL,
  hasValueList,
  needsColorCode,
  validateAttributeForm,
  type AttributeForm,
  type AttributeInputType,
} from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useCreateAttribute } from '../model/use-manage-catalog'
import { AttributeValueFields } from './AttributeValueFields'

const EMPTY_VALUE = { name: '', colorCode: '' }
const EMPTY_FORM: AttributeForm = { name: '', code: '', inputType: 'LIST', values: [EMPTY_VALUE] }

/** 항목 만들기: 이름 · 코드 · 입력 방식 + 목록 값 (직접 입력이면 목록 값 없음) */
export function CreateAttributeForm() {
  const create = useCreateAttribute()
  const [form, setForm] = useState<AttributeForm>(EMPTY_FORM)
  const [invalid, setInvalid] = useState<string | null>(null)
  const set = (patch: Partial<AttributeForm>) => setForm((prev) => ({ ...prev, ...patch }))
  const setValue = (index: number, value: AttributeForm['values'][number]) =>
    set({ values: form.values.map((item, i) => (i === index ? value : item)) })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateAttributeForm(form)
    setInvalid(message)
    if (!message) create.mutate(form, { onSuccess: () => setForm(EMPTY_FORM) })
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-3">
        <Label>
          항목 이름
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </Label>
        <Label>
          코드 (대문자 · _)
          <Input
            placeholder="예: MAIN_MATERIAL"
            value={form.code}
            onChange={(e) => set({ code: e.target.value })}
          />
        </Label>
        <Label>
          입력 방식
          <Select
            value={form.inputType}
            onChange={(e) => set({ inputType: e.target.value as AttributeInputType })}
          >
            {(Object.keys(ATTRIBUTE_INPUT_TYPE_LABEL) as AttributeInputType[]).map((type) => (
              <option key={type} value={type}>
                {ATTRIBUTE_INPUT_TYPE_LABEL[type]}
              </option>
            ))}
          </Select>
        </Label>
      </div>
      {hasValueList(form.inputType) && (
        <div className="space-y-2">
          <p className="text-sm font-medium">목록 값</p>
          {form.values.map((value, index) => (
            <div key={index} className="flex items-center gap-2">
              <AttributeValueFields
                value={value}
                hasColor={needsColorCode(form.inputType)}
                onChange={(next) => setValue(index, next)}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => set({ values: form.values.filter((_, i) => i !== index) })}
              >
                빼기
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => set({ values: [...form.values, EMPTY_VALUE] })}
          >
            값 추가
          </Button>
        </div>
      )}
      <Button type="submit" disabled={create.isPending}>
        항목 만들기
      </Button>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {create.isError && <StateMessage tone="error">{getErrorMessage(create.error)}</StateMessage>}
    </form>
  )
}
