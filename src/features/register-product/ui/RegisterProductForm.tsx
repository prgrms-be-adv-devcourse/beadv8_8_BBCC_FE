import { useState, type ReactNode } from 'react'
import { useCategoriesQuery, useCategoryInputsQuery } from '@/entities/product'
import { getErrorMessage } from '@/shared/api'
import { Card, CardTitle } from '@/shared/ui/card'
import { Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { demoCategoryId } from '../config/demo-product'
import { ProductFields, type ProductImagesField } from './ProductFields'

type RegisterProductFormProps = {
  /** 판매를 시작한 뒤 이어서 볼 상품 상세 주소 (영역마다 다름) */
  productHref: (productId: string) => string
  /** 이미지 입력 칸 (사진 업로드 기능). 사진을 올리지 않으면 기본 이미지로 보인다 */
  renderImages: (field: ProductImagesField) => ReactNode
}

/** 상품 등록: 카테고리를 고르면 그 카테고리의 옵션 · 정보 · 실측 항목으로 폼을 만든다 (실제 API) */
export function RegisterProductForm({ productHref, renderImages }: RegisterProductFormProps) {
  const categories = useCategoriesQuery()
  const [picked, setPicked] = useState('')
  const categoryId = picked || demoCategoryId(categories.data ?? [])
  const inputs = useCategoryInputsQuery(categoryId)

  return (
    <Card className="space-y-3">
      <CardTitle>상품 등록</CardTitle>
      <Label className="max-w-sm">
        카테고리
        <Select value={categoryId} onChange={(e) => setPicked(e.target.value)}>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.path}
            </option>
          ))}
        </Select>
      </Label>
      {categories.isError && (
        <StateMessage tone="error">{getErrorMessage(categories.error)}</StateMessage>
      )}
      {categories.data?.length === 0 && (
        <StateMessage>등록할 수 있는 카테고리가 없어요.</StateMessage>
      )}
      {inputs.isPending && categoryId && <StateMessage>입력 항목을 불러오는 중…</StateMessage>}
      {inputs.isError && <StateMessage tone="error">{getErrorMessage(inputs.error)}</StateMessage>}
      {inputs.data && (
        <ProductFields
          key={categoryId}
          inputs={inputs.data}
          productHref={productHref}
          renderImages={renderImages}
        />
      )}
    </Card>
  )
}
