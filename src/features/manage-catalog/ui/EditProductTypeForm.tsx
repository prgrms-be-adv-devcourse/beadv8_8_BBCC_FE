import { useState, type FormEvent } from 'react'
import {
  toProductTypeForm,
  validateProductTypeForm,
  type Attribute,
  type ProductType,
  type ProductTypeForm,
  type ProductTypeLinkForm,
} from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useChangeProductType } from '../model/use-manage-catalog'
import { ProductTypeLinksEditor } from './ProductTypeLinksEditor'

type EditProductTypeFormProps = {
  productType: ProductType
  attributes: Attribute[]
  onSaved?: () => void
}

/**
 * 상품 유형 수정: 이름은 읽기만 하고, 연결(설정 · 순서 · 새 항목)을 고쳐 연결 목록 전체를 보낸다.
 * 유형에 상품이 있는지 화면은 모르므로 그 제약은 미리 막지 않고 BE 응답(409)의 설명을 보여 준다
 */
export function EditProductTypeForm({
  productType,
  attributes,
  onSaved,
}: EditProductTypeFormProps) {
  const change = useChangeProductType(productType.id)
  const [form, setForm] = useState<ProductTypeForm>(() => toProductTypeForm(productType))
  const [invalid, setInvalid] = useState<string | null>(null)
  const setLinks = (links: ProductTypeLinkForm[]) => setForm((prev) => ({ ...prev, links }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateProductTypeForm(form, attributes)
    setInvalid(message)
    if (!message) change.mutate(form, { onSuccess: () => onSaved?.() })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">유형 이름</p>
          <p className="text-[15px] font-semibold">{productType.name}</p>
        </div>
        <ProductTypeLinksEditor attributes={attributes} links={form.links} onChange={setLinks} />
      </div>
      <Button type="submit" className="h-11 px-6 text-[15px]" disabled={change.isPending}>
        저장하기
      </Button>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {change.isError && <StateMessage tone="error">{getErrorMessage(change.error)}</StateMessage>}
    </form>
  )
}
