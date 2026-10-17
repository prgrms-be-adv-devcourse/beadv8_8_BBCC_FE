import { useState, type FormEvent, type ReactNode } from 'react'
import {
  canEditSaleInputs,
  existingComboStocks,
  ProductFormFields,
  toEditableProductForm,
  useCategoryInputsQuery,
  validateProductUpdateForm,
  type CategoryInputs,
  type ProductImagesField,
  type RegisterProductForm,
  type SellerProductDetail,
} from '@/entities/product'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useUpdateProduct } from '../model/use-manage-product'

type EditProductFormProps = {
  product: SellerProductDetail
  onDone: () => void
  /** 사진 입력 칸 (사진 업로드 기능). 지금 사진을 보여 주고 빼거나 더한다 */
  renderImages: (field: ProductImagesField) => ReactNode
}

/** 상품 수정: 등록과 같은 입력 칸을 지금 값으로 채운다. 카테고리는 바꿀 수 없다 */
export function EditProductForm({ product, onDone, renderImages }: EditProductFormProps) {
  const inputs = useCategoryInputsQuery(product.categoryId)
  if (inputs.isPending) return <StateMessage>입력 항목을 불러오는 중…</StateMessage>
  if (inputs.isError)
    return <StateMessage tone="error">{getErrorMessage(inputs.error)}</StateMessage>
  return (
    <EditFields
      inputs={inputs.data}
      product={product}
      onDone={onDone}
      renderImages={renderImages}
    />
  )
}

type EditFieldsProps = EditProductFormProps & { inputs: CategoryInputs }

function EditFields({ inputs, product, onDone, renderImages }: EditFieldsProps) {
  const update = useUpdateProduct(product)
  const [form, setForm] = useState<RegisterProductForm>(() =>
    toEditableProductForm(inputs, product),
  )
  const [invalid, setInvalid] = useState<string | null>(null)
  const [isUploading, setUploading] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateProductUpdateForm(inputs, form, product)
    setInvalid(message)
    if (!message) update.mutate({ inputs, form }, { onSuccess: onDone })
  }

  return (
    <form className="space-y-4 border-t pt-3" onSubmit={handleSubmit}>
      <p className="text-muted-foreground text-sm">
        카테고리: {inputs.categoryName} (바꿀 수 없어요)
      </p>
      <ProductFormFields
        inputs={inputs}
        form={form}
        onChange={setForm}
        isSaleInputsLocked={!canEditSaleInputs(product)}
        fixedStocks={existingComboStocks(inputs, product)}
        images={renderImages({
          value: form.imageUrls,
          onChange: (imageUrls) => setForm((prev) => ({ ...prev, imageUrls })),
          onUploadingChange: setUploading,
        })}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={update.isPending || isUploading}>
          수정 저장
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          취소
        </Button>
        {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
        {update.isError && (
          <StateMessage tone="error">
            {getErrorMessage(update.error)}
            {update.needsRecheck && ' 최신 내용을 다시 불러왔어요. 확인하고 다시 저장해 주세요.'}
          </StateMessage>
        )}
      </div>
    </form>
  )
}
