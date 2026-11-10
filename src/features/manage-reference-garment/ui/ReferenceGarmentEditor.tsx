import { useState, type FormEvent } from 'react'
import {
  GARMENT_PART_SPEC,
  MEASUREMENT_LABEL,
  measurementCodesOf,
  toReferenceGarmentForm,
  validateReferenceGarmentForm,
  type GarmentPart,
  type ReferenceGarment,
  type ReferenceGarmentForm,
} from '@/entities/recommendation'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import {
  useDeleteReferenceGarment,
  useSaveReferenceGarment,
} from '../model/use-manage-reference-garment'

type ReferenceGarmentEditorProps = {
  childId: string
  part: GarmentPart
  /** 저장한 기준 옷. 없으면 null */
  garment: ReferenceGarment | null
  /** 이 구분에 맞는 말단 카테고리 (세부 종류) */
  categories: { id: string; path: string }[]
  /** 처음 채울 값 (산 옷에서 고르기). 없으면 저장한 기준 옷 */
  initialForm?: ReferenceGarmentForm
  onSaved?: () => void
}

/** 기준 옷 한 칸: 저장한 값 요약, 세부 종류 · 실측 입력, 저장 · 삭제 */
export function ReferenceGarmentEditor({
  childId,
  part,
  garment,
  categories,
  initialForm,
  onSaved,
}: ReferenceGarmentEditorProps) {
  const spec = GARMENT_PART_SPEC[part]
  const save = useSaveReferenceGarment(childId, part)
  const remove = useDeleteReferenceGarment(childId, part)
  // 저장 · 삭제로 기준 옷이 바뀌면 화면이 key를 바꿔 새로 채운다
  const [form, setForm] = useState<ReferenceGarmentForm>(
    () => initialForm ?? toReferenceGarmentForm(part, garment),
  )
  const [invalid, setInvalid] = useState<string | null>(null)
  const savedCategory = categories.find((category) => category.id === garment?.categoryId)
  const setMeasurement = (code: string, text: string) =>
    setForm((prev) => ({ ...prev, measurements: { ...prev.measurements, [code]: text } }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateReferenceGarmentForm(part, form)
    setInvalid(message)
    if (!message) save.mutate(form, { onSuccess: () => onSaved?.() })
  }

  const handleDelete = async () => {
    const isConfirmed = await confirmAction({
      title: `${spec.label} 기준 옷을 지울까요?`,
      description: '지우면 이 구분은 기준 옷 없이 추천해요.',
      confirmLabel: '삭제',
      tone: 'danger',
    })
    if (isConfirmed) remove.mutate()
  }

  return (
    <form
      aria-label={`${spec.label} 기준 옷`}
      className="border-rule space-y-4 rounded-lg border p-4"
      onSubmit={handleSubmit}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-bold">{spec.label}</h3>
        <p className="text-ink-3 text-[13px]">
          {garment
            ? [
                savedCategory?.path ?? '세부 종류 확인 필요',
                ...garment.measurements.map((item) => `${item.label} ${item.value}cm`),
              ].join(' · ')
            : '아직 저장한 기준 옷이 없어요.'}
        </p>
      </div>
      <Label>
        세부 종류
        <Select
          className="h-10"
          value={form.categoryId}
          onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
        >
          <option value="">종류 고르기</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.path}
            </option>
          ))}
        </Select>
      </Label>
      <div className="grid grid-cols-2 gap-3">
        {measurementCodesOf(part).map((code) => (
          <Label key={code}>
            {`${MEASUREMENT_LABEL[code]} (cm${spec.required.includes(code) ? ', 필수' : ''})`}
            <Input
              className="h-10"
              inputMode="decimal"
              value={form.measurements[code] ?? ''}
              onChange={(e) => setMeasurement(code, e.target.value)}
            />
          </Label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={save.isPending}>
          저장하기
        </Button>
        {garment && (
          <Button
            type="button"
            variant="outline"
            disabled={remove.isPending}
            onClick={handleDelete}
          >
            삭제
          </Button>
        )}
      </div>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {save.isError && <StateMessage tone="error">{getErrorMessage(save.error)}</StateMessage>}
      {remove.isError && <StateMessage tone="error">{getErrorMessage(remove.error)}</StateMessage>}
    </form>
  )
}
