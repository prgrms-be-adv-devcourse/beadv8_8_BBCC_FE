import type { MeasurementItem, ProductType } from '@/entities/catalog'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/input'

type CategoryLeafFieldsProps = {
  productTypes: ProductType[]
  measurementItems: MeasurementItem[]
  productTypeId: string
  measurementItemIds: string[]
  onChange: (patch: { productTypeId?: string; measurementItemIds?: string[] }) => void
}

/** 말단 카테고리 입력: 상품 유형과 필수 실측 항목. 고른 순서가 실측표 열 순서라 뺐다가 다시 고르면 맨 뒤로 간다 */
export function CategoryLeafFields({
  productTypes,
  measurementItems,
  productTypeId,
  measurementItemIds,
  onChange,
}: CategoryLeafFieldsProps) {
  const toggleItem = (id: string) =>
    onChange({
      measurementItemIds: measurementItemIds.includes(id)
        ? measurementItemIds.filter((itemId) => itemId !== id)
        : [...measurementItemIds, id],
    })
  const chosenNames = measurementItemIds
    .map((id) => measurementItems.find((item) => item.id === id)?.name)
    .filter(Boolean)

  return (
    <>
      <Label>
        상품 유형
        <Select
          className="h-10"
          value={productTypeId}
          onChange={(e) => onChange({ productTypeId: e.target.value })}
        >
          <option value="">유형 고르기</option>
          {productTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Select>
      </Label>
      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">필수 실측 항목 (고른 순서대로)</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {measurementItems.map((item) => (
            <label key={item.id} className="flex min-h-8 items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                className="accent-signal size-4"
                checked={measurementItemIds.includes(item.id)}
                onChange={() => toggleItem(item.id)}
              />
              {item.name}
            </label>
          ))}
        </div>
        {chosenNames.length > 0 && (
          <p className="text-ink-3 text-[13px]">실측 순서: {chosenNames.join(' → ')}</p>
        )}
      </fieldset>
    </>
  )
}
