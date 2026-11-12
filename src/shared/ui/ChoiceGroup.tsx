import { cn } from '@/shared/lib'

type ChoiceGroupProps<T extends string> = {
  /** 묶음 이름 (화면 읽기 프로그램 · 라디오 그룹) */
  legend: string
  name: string
  options: { value: T; label: string }[]
  value: T | null
  onChange: (value: T) => void
  disabled?: boolean
}

/** 코드 중 하나 고르기 (사유 등). 실제 라디오라 키보드로도 고른다 */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset className="space-y-1.5" disabled={disabled}>
      <legend className="text-ink-3 text-[13px]">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'bg-paper flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm',
              value === option.value ? 'border-primary border-2 font-semibold' : 'border-rule',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
