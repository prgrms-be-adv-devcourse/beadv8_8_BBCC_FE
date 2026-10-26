import { Fragment, useState, type FormEvent, type ReactNode } from 'react'
import {
  canEditSaleInputs,
  existingComboStocks,
  ProductFormFields,
  productImageFields,
  toEditableProductForm,
  useImageUploading,
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
  const { isUploading, onUploadingChange } = useImageUploading()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateProductUpdateForm(inputs, form, product)
    setInvalid(message)
    if (!message) update.mutate({ inputs, form }, { onSuccess: onDone })
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <dl className="flex flex-wrap items-baseline gap-x-3 text-sm">
        <dt className="text-ink-3">카테고리</dt>
        <dd className="text-ink font-semibold">
          {inputs.categoryName} <span className="text-ink-3 font-normal">(바꿀 수 없어요)</span>
        </dd>
      </dl>
      <ProductFormFields
        inputs={inputs}
        form={form}
        onChange={setForm}
        isSaleInputsLocked={!canEditSaleInputs(product)}
        fixedStocks={existingComboStocks(inputs, product)}
        images={productImageFields(form, setForm, onUploadingChange).map((field) => (
          <Fragment key={field.label}>{renderImages(field)}</Fragment>
        ))}
      />
      <div className="border-rule flex flex-wrap items-center gap-3 border-t pt-6">
        <button
          type="submit"
          className="shop-btn min-h-10 text-[15px] max-lg:min-h-11"
          disabled={update.isPending || isUploading}
          aria-busy={update.isPending}
        >
          수정 저장
        </button>
        <Button type="button" variant="outline" className="h-10 px-4 max-lg:h-11" onClick={onDone}>
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
