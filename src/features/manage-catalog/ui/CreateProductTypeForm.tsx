import { useState, type FormEvent } from 'react'
import {
  validateProductTypeForm,
  type Attribute,
  type ProductTypeForm,
  type ProductTypeLinkForm,
} from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useCreateProductType } from '../model/use-manage-catalog'
import { ProductTypeLinksEditor } from './ProductTypeLinksEditor'

const EMPTY_FORM: ProductTypeForm = { name: '', links: [] }

type CreateProductTypeFormProps = { attributes: Attribute[]; onCreated?: () => void }

/** 상품 유형 만들기: 이름 + 연결할 항목과 그 설정. 넣은 순서가 등록 화면의 순서다 */
export function CreateProductTypeForm({ attributes, onCreated }: CreateProductTypeFormProps) {
  const create = useCreateProductType()
  const [form, setForm] = useState<ProductTypeForm>(EMPTY_FORM)
  const [invalid, setInvalid] = useState<string | null>(null)
  const setLinks = (links: ProductTypeLinkForm[]) => setForm((prev) => ({ ...prev, links }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateProductTypeForm(form, attributes)
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
          유형 이름
          <Input
            className="h-10"
            placeholder="예: 신발"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Label>
        <ProductTypeLinksEditor attributes={attributes} links={form.links} onChange={setLinks} />
      </div>
      <Button type="submit" className="h-11 px-6 text-[15px]" disabled={create.isPending}>
        상품 유형 만들기
      </Button>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {create.isError && <StateMessage tone="error">{getErrorMessage(create.error)}</StateMessage>}
    </form>
  )
}
