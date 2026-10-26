import { useState, type ReactNode } from 'react'
import {
  useCategoryGroupsQuery,
  useCategoryInputsQuery,
  type ProductImagesField,
} from '@/entities/product'
import { getErrorMessage } from '@/shared/api'
import { Select } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { demoCategoryId } from '../config/demo-product'
import { ProductFields } from './ProductFields'

type RegisterProductFormProps = {
  /** 판매를 시작한 뒤 이어서 볼 상품 상세 주소 (영역마다 다름) */
  productHref: (productId: string) => string
  /** 이미지 입력 칸 (사진 업로드 기능). 사진을 올리지 않으면 기본 이미지로 보인다 */
  renderImages: (field: ProductImagesField) => ReactNode
}

/** 상품 등록: 카테고리를 고르면 그 카테고리의 옵션 · 정보 · 실측 항목으로 폼을 만든다 (실제 API). 화면 제목은 페이지가 단다 */
export function RegisterProductForm({ productHref, renderImages }: RegisterProductFormProps) {
  const categories = useCategoryGroupsQuery()
  const groups = categories.data ?? []
  const [picked, setPicked] = useState('')
  const categoryId = picked || demoCategoryId(groups.flatMap((group) => group.categories))
  const group = groups.find((item) => item.categories.some((leaf) => leaf.id === categoryId))
  const inputs = useCategoryInputsQuery(categoryId)
  // 미리보기는 맨 위 자리에 둔다. 폼 값은 ProductFields가 가지므로 그 자리에 그려 넣는다
  const [previewSlot, setPreviewSlot] = useState<HTMLDivElement | null>(null)

  const handleGroupChange = (groupId: string) => {
    const next = groups.find((item) => item.id === groupId)
    setPicked(next?.categories[0]?.id ?? '')
  }

  return (
    <div className="space-y-8">
      <div ref={setPreviewSlot} className="empty:hidden" />
      <section className="space-y-3">
        <h2 className="text-section">카테고리</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="카테고리"
            className="w-40"
            value={group?.id ?? ''}
            onChange={(e) => handleGroupChange(e.target.value)}
          >
            {groups.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <span aria-hidden className="text-ink-3">
            ›
          </span>
          <Select
            aria-label="아래 단계 카테고리"
            className="w-52"
            value={categoryId}
            onChange={(e) => setPicked(e.target.value)}
          >
            {group?.categories.map((leaf) => (
              <option key={leaf.id} value={leaf.id}>
                {leaf.name}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-ink-3 text-[13px]">가장 아래 단계 카테고리에만 등록할 수 있어요.</p>
        {categories.isError && (
          <StateMessage tone="error">{getErrorMessage(categories.error)}</StateMessage>
        )}
        {groups.length === 0 && categories.isSuccess && (
          <StateMessage>등록할 수 있는 카테고리가 없어요.</StateMessage>
        )}
        {inputs.isPending && categoryId && <StateMessage>입력 항목을 불러오는 중…</StateMessage>}
        {inputs.isError && (
          <StateMessage tone="error">{getErrorMessage(inputs.error)}</StateMessage>
        )}
      </section>
      {inputs.data && (
        <ProductFields
          key={categoryId}
          inputs={inputs.data}
          productHref={productHref}
          renderImages={renderImages}
          previewSlot={previewSlot}
        />
      )}
    </div>
  )
}
