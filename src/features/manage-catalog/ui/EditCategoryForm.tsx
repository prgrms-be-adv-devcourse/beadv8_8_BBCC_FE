import { useState, type FormEvent } from 'react'
import {
  toCategoryChangeForm,
  validateCategoryChangeForm,
  type CatalogCategory,
  type CategoryChangeForm,
  type MeasurementItem,
  type ProductType,
} from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useChangeCategory } from '../model/use-manage-catalog'
import { CategoryLeafFields } from './CategoryLeafFields'
import { VisibleGenderField } from './VisibleGenderField'

type EditCategoryFormProps = {
  category: CatalogCategory
  path: string
  productTypes: ProductType[]
  measurementItems: MeasurementItem[]
  onSaved?: () => void
}

/**
 * 말단 카테고리 수정: 이름 · 위치는 읽기만 하고 상품 유형 · 필수 실측 항목 · 보일 성별을 바꾼다.
 * 카테고리에 상품이 있는지 화면은 모르므로 그 제약은 미리 막지 않고 BE 응답(409)의 설명을 보여 준다
 */
export function EditCategoryForm({
  category,
  path,
  productTypes,
  measurementItems,
  onSaved,
}: EditCategoryFormProps) {
  const change = useChangeCategory(category.id)
  const [form, setForm] = useState<CategoryChangeForm>(() => toCategoryChangeForm(category))
  const [invalid, setInvalid] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateCategoryChangeForm(form)
    setInvalid(message)
    if (!message) change.mutate(form, { onSuccess: () => onSaved?.() })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">카테고리</p>
          <p className="text-[15px] font-semibold">{path}</p>
        </div>
        <CategoryLeafFields
          productTypes={productTypes}
          measurementItems={measurementItems}
          productTypeId={form.productTypeId}
          measurementItemIds={form.measurementItemIds}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        />
        <VisibleGenderField
          value={form.visibleGender}
          onChange={(visibleGender) => setForm((prev) => ({ ...prev, visibleGender }))}
        />
      </div>
      <Button type="submit" className="h-11 px-6 text-[15px]" disabled={change.isPending}>
        저장하기
      </Button>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {change.isError && <StateMessage tone="error">{getErrorMessage(change.error)}</StateMessage>}
    </form>
  )
}
