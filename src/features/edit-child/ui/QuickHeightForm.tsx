import { useState, type FormEvent } from 'react'
import { toChildForm, type Child } from '@/entities/child'
import { getErrorMessage } from '@/shared/api'
import { cn } from '@/shared/lib'
import { useUpdateChild } from '../model/use-edit-child'

type QuickHeightFormProps = { child: Child; className?: string }

/** 키만 새로 기록: 자녀 수정(전체 교체)에 키만 바꿔 보낸다 → 서버가 성장 이력을 쌓고 추천이 바뀐다 */
export function QuickHeightForm({ child, className }: QuickHeightFormProps) {
  const update = useUpdateChild(child.id)
  const [height, setHeight] = useState('')
  const value = Number(height)
  const invalid = !height || !Number.isFinite(value) || value < 40 || value > 200

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (invalid) return
    update.mutate(
      { ...toChildForm(child), heightCm: Math.round(value * 10) / 10 },
      { onSuccess: () => setHeight('') },
    )
  }

  return (
    <form onSubmit={submit} className={cn('space-y-1', className)}>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          inputMode="decimal"
          aria-label={`${child.name} 키 (cm)`}
          placeholder={`키 (cm) · 지금 ${child.heightCm}`}
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="focus:border-growth h-11 min-w-0 flex-1 rounded-full border bg-white px-4 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={invalid || update.isPending}
          className="bg-growth-deep h-11 shrink-0 rounded-full px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          기록하기
        </button>
      </div>
      {update.isSuccess && (
        <p className="text-growth-deep text-xs">기록했어요. 추천 사이즈가 바뀌었어요.</p>
      )}
      {update.isError && (
        <p className="text-destructive text-xs">{getErrorMessage(update.error)}</p>
      )}
    </form>
  )
}
