import { useState, type FormEvent } from 'react'
import { validateMeasurementItemForm, type MeasurementItemForm } from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useCreateMeasurementItem } from '../model/use-manage-catalog'

const EMPTY_FORM: MeasurementItemForm = { name: '', code: '', unit: 'cm' }

type CreateMeasurementItemFormProps = { onCreated?: () => void }

/** 실측 항목 만들기: 이름 · 코드 · 단위 */
export function CreateMeasurementItemForm({ onCreated }: CreateMeasurementItemFormProps) {
  const create = useCreateMeasurementItem()
  const [form, setForm] = useState<MeasurementItemForm>(EMPTY_FORM)
  const [invalid, setInvalid] = useState<string | null>(null)
  const set = (patch: Partial<MeasurementItemForm>) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateMeasurementItemForm(form)
    setInvalid(message)
    if (!message)
      create.mutate(form, {
        onSuccess: () => {
          setForm(EMPTY_FORM)
          onCreated?.()
        },
      })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <Label>
          실측 항목 이름
          <Input
            className="h-10"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Label>
        <Label>
          코드 (대문자 · _)
          <Input
            className="h-10"
            placeholder="예: TOTAL_LENGTH"
            value={form.code}
            onChange={(e) => set({ code: e.target.value })}
          />
        </Label>
        <Label>
          단위
          <Input
            className="h-10 w-32"
            value={form.unit}
            onChange={(e) => set({ unit: e.target.value })}
          />
        </Label>
      </div>
      <Button type="submit" className="h-11 px-6 text-[15px]" disabled={create.isPending}>
        실측 항목 만들기
      </Button>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {create.isError && <StateMessage tone="error">{getErrorMessage(create.error)}</StateMessage>}
    </form>
  )
}
