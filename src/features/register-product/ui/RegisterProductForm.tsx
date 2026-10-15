import { useState, type FormEvent } from 'react'
import {
  type Category,
  validateRegisterProductForm,
  type ProductSizeRow,
  type RegisterProductForm as RegisterProductFormValue,
} from '@/entities/product'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { DEMO_PRODUCT, EMPTY_SIZE_ROW } from '../config/demo-product'
import { useRegisterProduct } from '../model/use-register-product'

/** 상품 등록 (목 API). 옵션 = 색상 × 소재 × 사이즈, 사이즈마다 권장 키 */
type RegisterProductFormProps = {
  /** 고를 수 있는 카테고리 (페이지가 카테고리 API로 불러와 넘긴다) */
  categories: Category[]
}

export function RegisterProductForm({ categories }: RegisterProductFormProps) {
  const register = useRegisterProduct()
  const [form, setForm] = useState<RegisterProductFormValue>(DEMO_PRODUCT)
  const [invalid, setInvalid] = useState<string | null>(null)

  const set = <K extends keyof RegisterProductFormValue>(
    key: K,
    value: RegisterProductFormValue[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }))
  const updateRow = (index: number, patch: Partial<ProductSizeRow>) =>
    set(
      'sizes',
      form.sizes.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateRegisterProductForm(form)
    setInvalid(message)
    if (!message) register.mutate(form)
  }

  return (
    <Card>
      <CardTitle className="mb-3">상품 등록</CardTitle>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-4 gap-3">
          <Label className="col-span-2">
            상품명
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Label>
          <Label>
            카테고리
            <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.path}
                </option>
              ))}
            </Select>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Label>
              색상
              <Input value={form.color} onChange={(e) => set('color', e.target.value)} />
            </Label>
            <Label>
              소재
              <Input value={form.material} onChange={(e) => set('material', e.target.value)} />
            </Label>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-left">
            <tr>
              <th>사이즈</th>
              <th>권장 키 (cm)</th>
              <th>가격</th>
              <th>재고</th>
            </tr>
          </thead>
          <tbody>
            {form.sizes.map((row, index) => (
              <tr key={index}>
                <td className="pr-2">
                  <Input
                    value={row.size}
                    onChange={(e) => updateRow(index, { size: e.target.value })}
                  />
                </td>
                <td className="flex items-center gap-1 pr-2">
                  <Input
                    type="number"
                    value={row.minHeightCm}
                    onChange={(e) => updateRow(index, { minHeightCm: Number(e.target.value) })}
                  />
                  ~
                  <Input
                    type="number"
                    value={row.maxHeightCm}
                    onChange={(e) => updateRow(index, { maxHeightCm: Number(e.target.value) })}
                  />
                </td>
                <td className="pr-2">
                  <Input
                    type="number"
                    value={row.price}
                    onChange={(e) => updateRow(index, { price: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <Input
                    type="number"
                    value={row.stock}
                    onChange={(e) => updateRow(index, { stock: Number(e.target.value) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => set('sizes', [...form.sizes, EMPTY_SIZE_ROW])}
          >
            사이즈 추가
          </Button>
          <Button type="submit" disabled={register.isPending}>
            등록하기
          </Button>
          {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
          {register.isError && (
            <StateMessage tone="error">{getErrorMessage(register.error)}</StateMessage>
          )}
          {register.isSuccess && (
            <StateMessage>등록했어요. 아래에서 판매를 시작하세요.</StateMessage>
          )}
        </div>
      </form>
    </Card>
  )
}
