import { Fragment, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  ProductFormFields,
  productImageFields,
  useImageUploading,
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
import { useRegisterAndStartSale } from '../model/use-register-product'
import { StartSaleButton } from './StartSaleButton'

type ProductFieldsProps = {
  inputs: CategoryInputs
  productHref: (productId: string) => string
  renderImages: (field: ProductImagesField) => ReactNode
}

/** 카테고리 입력 항목으로 만든 등록 폼 본문 + 등록 결과(판매 시작 → 상세, 판매 시작만 실패하면 다시 시작) */
export function ProductFields({ inputs, productHref, renderImages }: ProductFieldsProps) {
  const register = useRegisterAndStartSale(inputs)
  const [form, setForm] = useState<RegisterProductFormValue>(() => demoRegisterForm(inputs))
  const [invalid, setInvalid] = useState<string | null>(null)
  const { isUploading, onUploadingChange } = useImageUploading()
  // 판매 시작만 실패해 다시 시작한 상품
  const [restartedId, setRestartedId] = useState<string | null>(null)
  // 고치다가 다른 화면으로 나가면 확인 (등록하면 풀린다)
  const [isDirty, setIsDirty] = useState(false)
  useLeaveGuard(isDirty, '등록하지 않은 상품 입력이 사라져요.')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateRegisterProductForm(inputs, form)
    setInvalid(message)
    if (!message) {
      setRestartedId(null)
      register.mutate(form, { onSuccess: () => setIsDirty(false) })
    }
  }

  const registered = register.data?.registered
  const isStarted =
    !!registered && (!register.data?.startError || restartedId === registered.productId)

  return (
    <form className="space-y-4" onSubmit={handleSubmit} onChangeCapture={() => setIsDirty(true)}>
      <ProductFormFields
        inputs={inputs}
        form={form}
        onChange={setForm}
        images={productImageFields(form, setForm, onUploadingChange).map((field) => (
          <Fragment key={field.label}>{renderImages(field)}</Fragment>
        ))}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={register.isPending || isUploading}>
          등록하고 판매 시작
        </Button>
        {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
        {register.isError && (
          <StateMessage tone="error">{getErrorMessage(register.error)}</StateMessage>
        )}
      </div>

      {registered && (
        <div className="bg-muted/40 flex flex-wrap items-center gap-3 rounded-lg p-3 text-sm">
          <span>
            {isStarted
              ? `상품 #${registered.productId}를 등록하고 판매를 시작했어요 (옵션 ${registered.options.length}개).`
              : `상품 #${registered.productId}를 등록했지만 판매를 시작하지 못해 판매 대기로 남았어요. ${getErrorMessage(register.data?.startError)}`}
          </span>
          {isStarted ? (
            <Link
              to={productHref(registered.productId)}
              className="text-primary font-medium underline"
            >
              상품 상세 보기
            </Link>
          ) : (
            <StartSaleButton
              productId={registered.productId}
              onStarted={() => setRestartedId(registered.productId)}
            />
          )}
        </div>
      )}
    </form>
  )
}
