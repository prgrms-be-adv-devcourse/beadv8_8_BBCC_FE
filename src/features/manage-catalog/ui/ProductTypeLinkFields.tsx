import type { ReactNode } from 'react'
import {
  ATTRIBUTE_INPUT_TYPE_LABEL,
  ATTRIBUTE_ROLE_LABEL,
  canBeOption,
  type Attribute,
  type AttributeRole,
  type ProductTypeLinkForm,
} from '@/entities/catalog'
import { Button } from '@/shared/ui/button'
import { Select } from '@/shared/ui/input'

type ProductTypeLinkFieldsProps = {
  attribute: Attribute
  link: ProductTypeLinkForm
  onChange: (link: ProductTypeLinkForm) => void
  onRemove: () => void
}

type CheckProps = { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }

function Check({ checked, onChange, children }: CheckProps) {
  return (
    <label className="flex min-h-8 items-center gap-1.5 text-sm">
      <input
        type="checkbox"
        className="accent-signal size-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {children}
    </label>
  )
}

/** 유형에 연결한 항목 하나의 설정: 역할 · 필수 · 사이즈 역할 · 가격 구분 · 허용 값 */
export function ProductTypeLinkFields({
  attribute,
  link,
  onChange,
  onRemove,
}: ProductTypeLinkFieldsProps) {
  const set = (patch: Partial<ProductTypeLinkForm>) => onChange({ ...link, ...patch })
  const isOption = link.role === 'OPTION'
  const toggleValue = (valueId: string) =>
    set({
      allowedValueIds: link.allowedValueIds.includes(valueId)
        ? link.allowedValueIds.filter((id) => id !== valueId)
        : [...link.allowedValueIds, valueId],
    })
  // 정보 항목이 되면 옵션에만 있는 설정을 끈다
  const changeRole = (role: AttributeRole) =>
    set(role === 'OPTION' ? { role } : { role, sizeRole: false, priceAffecting: false })

  return (
    <div className="border-rule space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium">{attribute.name}</span>
        <span className="text-ink-3 text-xs">
          {attribute.code} · {ATTRIBUTE_INPUT_TYPE_LABEL[attribute.inputType]}
        </span>
        <Select
          aria-label={`${attribute.name} 역할`}
          className="w-28"
          value={link.role}
          onChange={(e) => changeRole(e.target.value as AttributeRole)}
        >
          {(['OPTION', 'INFO'] as const).map((role) => (
            <option
              key={role}
              value={role}
              disabled={role === 'OPTION' && !canBeOption(attribute.inputType)}
            >
              {ATTRIBUTE_ROLE_LABEL[role]}
            </option>
          ))}
        </Select>
        <Check checked={link.required} onChange={(required) => set({ required })}>
          필수
        </Check>
        {isOption && (
          <>
            <Check checked={link.sizeRole} onChange={(sizeRole) => set({ sizeRole })}>
              사이즈 역할
            </Check>
            <Check
              checked={link.priceAffecting}
              onChange={(priceAffecting) => set({ priceAffecting })}
            >
              가격 구분
            </Check>
          </>
        )}
        {attribute.inputType !== 'TEXT' && (
          <Check
            checked={link.allValuesAllowed}
            onChange={(allValuesAllowed) => set({ allValuesAllowed })}
          >
            모든 값 허용
          </Check>
        )}
        <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={onRemove}>
          빼기
        </Button>
      </div>
      {attribute.inputType !== 'TEXT' && !link.allValuesAllowed && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {attribute.values.map((value) => (
            <Check
              key={value.id}
              checked={link.allowedValueIds.includes(value.id)}
              onChange={() => toggleValue(value.id)}
            >
              {value.name}
            </Check>
          ))}
        </div>
      )}
    </div>
  )
}
