import type { InputAttribute } from '../model/product'

type OptionValuePickerProps = {
  attribute: InputAttribute
  /** 고른 값 ID */
  selected: string[]
  onToggle: (valueId: string) => void
}

/** 옵션 항목 하나(예: 색상)의 값 고르기. 고른 값의 모든 조합이 옵션이 된다 */
export function OptionValuePicker({ attribute, selected, onToggle }: OptionValuePickerProps) {
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="text-ink-2 mb-2 text-sm font-semibold">{attribute.name}</legend>
      <div className="flex flex-wrap gap-2">
        {attribute.values.map((value) => (
          <label
            key={value.id}
            className="border-field-edge hover:bg-paper-2 has-checked:border-signal has-checked:bg-signal-soft has-disabled:hover:bg-paper flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors has-disabled:cursor-not-allowed has-disabled:opacity-60 max-lg:h-11"
          >
            <input
              type="checkbox"
              className="accent-signal size-4"
              checked={selected.includes(value.id)}
              onChange={() => onToggle(value.id)}
            />
            {value.colorCode && (
              <span
                aria-hidden
                className="border-rule size-3.5 rounded-full border"
                style={{ backgroundColor: value.colorCode }}
              />
            )}
            {value.name}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
