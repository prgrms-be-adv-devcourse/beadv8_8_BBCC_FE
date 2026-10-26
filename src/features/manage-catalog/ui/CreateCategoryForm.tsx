import { useState, type FormEvent } from 'react'
import {
  categoryPath,
  parentCandidates,
  validateCategoryForm,
  type CatalogCategory,
  type CategoryForm,
  type CategoryKind,
  type MeasurementItem,
  type ProductType,
} from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useCreateCategory } from '../model/use-manage-catalog'

const EMPTY_FORM: CategoryForm = {
  name: '',
  parentId: '',
  kind: 'LEAF',
  productTypeId: '',
  measurementItemIds: [],
}

const KIND_LABEL: Record<CategoryKind, string> = {
  MIDDLE: '중간 카테고리 (아래에 카테고리를 둠)',
  LEAF: '말단 카테고리 (상품을 등록함)',
}

type CreateCategoryFormProps = {
  categories: CatalogCategory[]
  productTypes: ProductType[]
  measurementItems: MeasurementItem[]
  onCreated?: () => void
}

/** 카테고리 만들기: 이름 · 부모 · 종류. 말단이면 상품 유형과 필수 실측 항목(고른 순서가 실측표 열 순서) */
export function CreateCategoryForm({
  categories,
  productTypes,
  measurementItems,
  onCreated,
}: CreateCategoryFormProps) {
  const create = useCreateCategory()
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM)
  const [invalid, setInvalid] = useState<string | null>(null)
  const set = (patch: Partial<CategoryForm>) => setForm((prev) => ({ ...prev, ...patch }))
  const toggleItem = (id: string) =>
    set({
      measurementItemIds: form.measurementItemIds.includes(id)
        ? form.measurementItemIds.filter((itemId) => itemId !== id)
        : [...form.measurementItemIds, id],
    })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateCategoryForm(form, categories)
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
          카테고리 이름
          <Input
            className="h-10"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Label>
        <Label>
          부모 카테고리
          <Select
            className="h-10"
            value={form.parentId}
            onChange={(e) => set({ parentId: e.target.value })}
          >
            <option value="">없음 (최상위)</option>
            {parentCandidates(categories).map((category) => (
              <option key={category.id} value={category.id}>
                {categoryPath(category, categories)}
              </option>
            ))}
          </Select>
        </Label>
        <Label>
          종류
          <Select
            className="h-10"
            value={form.kind}
            onChange={(e) => set({ kind: e.target.value as CategoryKind })}
          >
            {(Object.keys(KIND_LABEL) as CategoryKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABEL[kind]}
              </option>
            ))}
          </Select>
        </Label>
      </div>
      {form.kind === 'LEAF' && (
        <>
          <Label>
            상품 유형
            <Select
              className="h-10"
              value={form.productTypeId}
              onChange={(e) => set({ productTypeId: e.target.value })}
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
                    checked={form.measurementItemIds.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                  />
                  {item.name}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}
      <Button type="submit" className="h-11 px-6 text-[15px]" disabled={create.isPending}>
        카테고리 만들기
      </Button>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {create.isError && <StateMessage tone="error">{getErrorMessage(create.error)}</StateMessage>}
    </form>
  )
}
