import { useState } from 'react'
import { BODY_TYPE_LABEL, type BodyType, type GrowthRecord } from '@/entities/child'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useUpdateGrowthRecord } from '../model/use-edit-child'
import { MockBadge } from '@/shared/ui/MockBadge'

type EditGrowthRecordProps = { childId: string; record: GrowthRecord }

/** 성장 이력 한 줄 수정 (기획서 8장 보완 · 목) */
export function EditGrowthRecord({ childId, record }: EditGrowthRecordProps) {
  const update = useUpdateGrowthRecord(childId)
  const [open, setOpen] = useState(false)
  const [heightCm, setHeightCm] = useState(record.heightCm)
  const [bodyType, setBodyType] = useState<BodyType | null>(record.bodyType)
  const invalid = !(heightCm >= 40 && heightCm <= 200)

  if (!open) {
    return (
      <span className="inline-flex items-center">
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          수정
        </Button>
        <MockBadge endpoints={['PATCH /children/:childId/growth-records/:recordId']} />
      </span>
    )
  }
  return (
    <span className="flex flex-wrap items-center justify-end gap-1.5">
      <Input
        aria-label="기록 키"
        type="number"
        step="0.1"
        className="figure h-9 w-24 rounded-md"
        value={heightCm}
        onChange={(e) => setHeightCm(Number(e.target.value))}
      />
      <Select
        aria-label="기록 체형"
        className="h-9 w-24 rounded-md"
        value={bodyType ?? ''}
        onChange={(e) => setBodyType((e.target.value || null) as BodyType | null)}
      >
        <option value="">입력 안 함</option>
        {Object.entries(BODY_TYPE_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Button
        size="sm"
        disabled={invalid || update.isPending}
        onClick={() =>
          update.mutate(
            { recordId: record.id, heightCm, bodyType },
            { onSuccess: () => setOpen(false) },
          )
        }
      >
        저장
      </Button>
      {update.isError && <StateMessage tone="error">{getErrorMessage(update.error)}</StateMessage>}
    </span>
  )
}
