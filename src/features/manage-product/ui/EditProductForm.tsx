import { useState, type FormEvent, type ReactNode } from 'react'
import {
  toProductEditForm,
  validateProductEditForm,
  type ProductEditForm,
  type ProductImagesField,
  type SellerProductDetail,
} from '@/entities/product'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useUpdateProduct } from '../model/use-manage-product'

type EditProductFormProps = {
  product: SellerProductDetail
  onDone: () => void
  /** 사진 입력 칸 (사진 업로드 기능). 새로 올리면 그 사진으로 바꾼다 */
  renderImages: (field: ProductImagesField) => ReactNode
}

export function EditProductForm({ product, onDone, renderImages }: EditProductFormProps) {
  const update = useUpdateProduct(product.id)
  const [form, setForm] = useState<ProductEditForm>(() => toProductEditForm(product))
  const [newImageUrls, setNewImageUrls] = useState<string[]>([])
  const [isUploading, setUploading] = useState(false)
  const invalid = validateProductEditForm(form)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!invalid) update.mutate({ form, newImageUrls }, { onSuccess: onDone })
  }

  return (
    <form className="grid grid-cols-2 gap-3 border-t pt-3" onSubmit={handleSubmit}>
      <Label>
        상품명
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Label>
      <div />
      {product.options.map((option) => (
        <Label key={option.id}>
          {option.name} 가격 (원)
          <Input
            type="number"
            value={form.prices[option.id]}
            onChange={(e) =>
              setForm({ ...form, prices: { ...form.prices, [option.id]: Number(e.target.value) } })
            }
          />
        </Label>
      ))}
      <div className="col-span-2 space-y-1">
        <p className="text-muted-foreground text-sm">
          지금 사진은 여기서 보이지 않아요. 새로 올리면 그 사진으로 바뀌고, 올리지 않으면
          그대로예요.
        </p>
        {renderImages({
          value: newImageUrls,
          onChange: setNewImageUrls,
          onUploadingChange: setUploading,
        })}
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <Button type="submit" disabled={invalid !== null || update.isPending || isUploading}>
          수정 저장
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          취소
        </Button>
        {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
        {update.isError && (
          <StateMessage tone="error">{getErrorMessage(update.error)}</StateMessage>
        )}
      </div>
    </form>
  )
}
