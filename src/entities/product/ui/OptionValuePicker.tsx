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
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">{attribute.name} (옵션)</legend>
      <div className="flex flex-wrap gap-2">
        {attribute.values.map((value) => (
          <label
            key={value.id}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
          >
            <input
              type="checkbox"
              checked={selected.includes(value.id)}
              onChange={() => onToggle(value.id)}
            />
            {value.colorCode && (
              <span
                aria-hidden
                className="size-3 rounded-full border"
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
