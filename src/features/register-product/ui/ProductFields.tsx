import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ProductFormFields,
  validateRegisterProductForm,
  type CategoryInputs,
  type ProductImagesField,
  type RegisterProductForm as RegisterProductFormValue,
} from '@/entities/product'
import { useLeaveGuard } from '@/shared/lib'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { demoRegisterForm } from '../config/demo-product'
import { useRegisterProduct } from '../model/use-register-product'
import { StartSaleButton } from './StartSaleButton'

type ProductFieldsProps = {
  inputs: CategoryInputs
  productHref: (productId: string) => string
  renderImages: (field: ProductImagesField) => ReactNode
}

/** 카테고리 입력 항목으로 만든 등록 폼 본문 + 등록 결과(판매 시작 → 상세) */
export function ProductFields({ inputs, productHref, renderImages }: ProductFieldsProps) {
  const register = useRegisterProduct(inputs)
  const [form, setForm] = useState<RegisterProductFormValue>(() => demoRegisterForm(inputs))
  const [invalid, setInvalid] = useState<string | null>(null)
  const [isUploading, setUploading] = useState(false)
  const [startedId, setStartedId] = useState<string | null>(null)
  // 고치다가 다른 화면으로 나가면 확인 (등록하면 풀린다)
  const [isDirty, setIsDirty] = useState(false)
  useLeaveGuard(isDirty, '등록하지 않은 상품 입력이 사라져요.')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateRegisterProductForm(inputs, form)
    setInvalid(message)
    if (!message) {
      setStartedId(null)
      register.mutate(form, { onSuccess: () => setIsDirty(false) })
    }
  }

  const registered = register.data

  return (
    <form className="space-y-4" onSubmit={handleSubmit} onChangeCapture={() => setIsDirty(true)}>
      <ProductFormFields
        inputs={inputs}
        form={form}
        onChange={setForm}
        images={renderImages({
          value: form.imageUrls,
          onChange: (imageUrls) => setForm((prev) => ({ ...prev, imageUrls })),
          onUploadingChange: setUploading,
        })}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={register.isPending || isUploading}>
          등록하기
        </Button>
        {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
        {register.isError && (
          <StateMessage tone="error">{getErrorMessage(register.error)}</StateMessage>
        )}
      </div>

      {registered && (
        <div className="bg-muted/40 flex flex-wrap items-center gap-3 rounded-lg p-3 text-sm">
          <span>
            상품 #{registered.productId}를 등록했어요 (옵션 {registered.options.length}개).
            {startedId ? ' 판매를 시작했어요.' : ' 판매를 시작하면 구매자에게 보여요.'}
          </span>
          {startedId ? (
            <Link to={productHref(startedId)} className="text-primary font-medium underline">
              상품 상세 보기
            </Link>
          ) : (
            <StartSaleButton
              productId={registered.productId}
              onStarted={() => setStartedId(registered.productId)}
            />
          )}
        </div>
      )}
    </form>
  )
}
