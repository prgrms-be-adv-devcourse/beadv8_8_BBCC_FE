import { useState, type FormEvent } from 'react'
import {
  canBeOption,
  validateProductTypeForm,
  type Attribute,
  type ProductTypeForm,
  type ProductTypeLinkForm,
} from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useCreateProductType } from '../model/use-manage-catalog'
import { ProductTypeLinkFields } from './ProductTypeLinkFields'

const EMPTY_FORM: ProductTypeForm = { name: '', links: [] }

/** 고를 수 있으면 옵션 · 필수 · 모든 값 허용으로 연결하고, 아니면 정보 항목으로 */
function newLink(attribute: Attribute): ProductTypeLinkForm {
  return {
    attributeId: attribute.id,
    role: canBeOption(attribute.inputType) ? 'OPTION' : 'INFO',
    required: canBeOption(attribute.inputType),
    allValuesAllowed: true,
    sizeRole: false,
    priceAffecting: false,
    allowedValueIds: [],
  }
}

type CreateProductTypeFormProps = { attributes: Attribute[] }

/** 상품 유형 만들기: 이름 + 연결할 항목과 그 설정. 넣은 순서가 등록 화면의 순서다 */
export function CreateProductTypeForm({ attributes }: CreateProductTypeFormProps) {
  const create = useCreateProductType()
  const [form, setForm] = useState<ProductTypeForm>(EMPTY_FORM)
  const [invalid, setInvalid] = useState<string | null>(null)
  const linked = new Set(form.links.map((link) => link.attributeId))
  const setLinks = (links: ProductTypeLinkForm[]) => setForm((prev) => ({ ...prev, links }))

  const addLink = (attributeId: string) => {
    const attribute = attributes.find((item) => item.id === attributeId)
    if (attribute) setLinks([...form.links, newLink(attribute)])
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateProductTypeForm(form, attributes)
    setInvalid(message)
    if (!message) create.mutate(form, { onSuccess: () => setForm(EMPTY_FORM) })
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <Label>
          유형 이름
          <Input
            placeholder="예: 신발"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Label>
        <Label>
          연결할 항목
          <Select value="" onChange={(e) => addLink(e.target.value)}>
            <option value="">항목 고르기</option>
            {attributes
              .filter((attribute) => !linked.has(attribute.id))
              .map((attribute) => (
                <option key={attribute.id} value={attribute.id}>
                  {attribute.name} ({attribute.code})
                </option>
              ))}
          </Select>
        </Label>
      </div>
      {form.links.map((link, index) => {
        const attribute = attributes.find((item) => item.id === link.attributeId)
        return (
          attribute && (
            <ProductTypeLinkFields
              key={link.attributeId}
              attribute={attribute}
              link={link}
              onChange={(next) =>
                setLinks(form.links.map((item, i) => (i === index ? next : item)))
              }
              onRemove={() => setLinks(form.links.filter((_, i) => i !== index))}
            />
          )
        )
      })}
      <Button type="submit" disabled={create.isPending}>
        상품 유형 만들기
      </Button>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {create.isError && <StateMessage tone="error">{getErrorMessage(create.error)}</StateMessage>}
    </form>
  )
}
