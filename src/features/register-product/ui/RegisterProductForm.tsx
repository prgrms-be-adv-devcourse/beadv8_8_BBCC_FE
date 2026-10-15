import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import {
  isFreeSize,
  optionCombos,
  priceGroups,
  sizeValues,
  useCategoriesQuery,
  useCategoryInputsQuery,
  validateRegisterProductForm,
  type CategoryInputs,
  type RegisterProductForm as RegisterProductFormValue,
  type SizeSpecInput,
} from '@/entities/product'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { demoCategoryId, demoRegisterForm } from '../config/demo-product'
import { useRegisterProduct } from '../model/use-register-product'
import { StartSaleButton } from './StartSaleButton'

type RegisterProductFormProps = {
  /** 판매를 시작한 뒤 이어서 볼 상품 상세 주소 (영역마다 다름) */
  productHref: (productId: string) => string
}

/** 상품 등록: 카테고리를 고르면 그 카테고리의 옵션 · 정보 · 실측 항목으로 폼을 만든다 (실제 API) */
export function RegisterProductForm({ productHref }: RegisterProductFormProps) {
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
        <ProductFields key={categoryId} inputs={inputs.data} productHref={productHref} />
      )}
    </Card>
  )
}

const EMPTY_SPEC: SizeSpecInput = { minHeightCm: 0, maxHeightCm: 0, measurements: {} }

type ProductFieldsProps = { inputs: CategoryInputs; productHref: (productId: string) => string }

function ProductFields({ inputs, productHref }: ProductFieldsProps) {
  const register = useRegisterProduct(inputs)
  const [form, setForm] = useState<RegisterProductFormValue>(() => demoRegisterForm(inputs))
  const [invalid, setInvalid] = useState<string | null>(null)
  const [startedId, setStartedId] = useState<string | null>(null)
  const combos = optionCombos(inputs, form)
  const groups = priceGroups(inputs, form)
  const sizes = sizeValues(inputs, form)

  const set = <K extends keyof RegisterProductFormValue>(
    key: K,
    value: RegisterProductFormValue[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const toggleValue = (attributeId: string, valueId: string) => {
    const current = form.optionValues[attributeId] ?? []
    set('optionValues', {
      ...form.optionValues,
      [attributeId]: current.includes(valueId)
        ? current.filter((id) => id !== valueId)
        : [...current, valueId],
    })
  }

  const setSpec = (valueId: string, patch: Partial<SizeSpecInput>) =>
    set('sizeSpecs', {
      ...form.sizeSpecs,
      [valueId]: {
        ...(form.sizeSpecs[valueId] ?? EMPTY_SPEC),
        ...patch,
      },
    })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateRegisterProductForm(inputs, form)
    setInvalid(message)
    if (!message) {
      setStartedId(null)
      register.mutate(form)
    }
  }

  const registered = register.data

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-3">
        <Label className="md:col-span-2">
          상품명
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Label>
        <Label>
          브랜드
          <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} />
        </Label>
      </div>

      {inputs.infoAttributes.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {inputs.infoAttributes.map((attribute) => {
            const input = form.info[attribute.id] ?? { valueId: '', text: '' }
            const update = (patch: Partial<typeof input>) =>
              set('info', { ...form.info, [attribute.id]: { ...input, ...patch } })
            return (
              <Label key={attribute.id}>
                {attribute.name}
                {attribute.required && ' *'}
                {attribute.values.length > 0 ? (
                  <Select
                    value={input.valueId}
                    onChange={(e) => update({ valueId: e.target.value })}
                  >
                    <option value="">고르기</option>
                    {attribute.values.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input value={input.text} onChange={(e) => update({ text: e.target.value })} />
                )}
              </Label>
            )
          })}
        </div>
      )}

      {inputs.optionAttributes.map((attribute) => (
        <fieldset key={attribute.id} className="space-y-1">
          <legend className="text-sm font-medium">{attribute.name} (옵션)</legend>
          <div className="flex flex-wrap gap-2">
            {attribute.values.map((value) => (
              <label
                key={value.id}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
              >
                <input
                  type="checkbox"
                  checked={(form.optionValues[attribute.id] ?? []).includes(value.id)}
                  onChange={() => toggleValue(attribute.id, value.id)}
                />
                {value.colorCode && (
                  <span
                    aria-hidden
                    className="size-3 rounded-full border"
                    style={{ backgroundColor: value.colorCode }}
                  />
                )}
                {value.name}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {combos.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">옵션 · 처음 재고</p>
            {combos.map((combo) => (
              <Label key={combo.key} className="flex-row items-center justify-between gap-2">
                <span className="text-sm font-normal">{combo.label}</span>
                <Input
                  aria-label={`${combo.label} 재고`}
                  type="number"
                  min={0}
                  className="w-24"
                  value={form.stocks[combo.key] ?? 0}
                  onChange={(e) =>
                    set('stocks', { ...form.stocks, [combo.key]: Number(e.target.value) })
                  }
                />
              </Label>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">판매가 (원)</p>
            {groups.map((group) => (
              <Label key={group.key} className="flex-row items-center justify-between gap-2">
                <span className="text-sm font-normal">{group.label}</span>
                <Input
                  aria-label={`${group.label} 판매가`}
                  type="number"
                  min={1}
                  className="w-32"
                  value={form.prices[group.key] ?? 0}
                  onChange={(e) =>
                    set('prices', { ...form.prices, [group.key]: Number(e.target.value) })
                  }
                />
              </Label>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="사이즈별 권장 키 · 실측">
            <thead className="text-muted-foreground text-left">
              <tr>
                <th className="font-medium">사이즈</th>
                <th className="font-medium">권장 키 (cm)</th>
                {inputs.measurementItems.map((item) => (
                  <th key={item.code} className="font-medium">
                    {item.name} ({item.unit})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizes.map((value) => {
                const spec = form.sizeSpecs[value.id]
                return (
                  <tr key={value.id}>
                    <td className="pr-2">
                      {value.name}
                      {isFreeSize(value.name) && ' (권장 키 선택)'}
                    </td>
                    <td className="flex items-center gap-1 pr-2">
                      <Input
                        aria-label={`${value.name} 권장 키 최소`}
                        type="number"
                        className="w-20"
                        value={spec?.minHeightCm ?? 0}
                        onChange={(e) => setSpec(value.id, { minHeightCm: Number(e.target.value) })}
                      />
                      ~
                      <Input
                        aria-label={`${value.name} 권장 키 최대`}
                        type="number"
                        className="w-20"
                        value={spec?.maxHeightCm ?? 0}
                        onChange={(e) => setSpec(value.id, { maxHeightCm: Number(e.target.value) })}
                      />
                    </td>
                    {inputs.measurementItems.map((item) => (
                      <td key={item.code} className="pr-2">
                        <Input
                          aria-label={`${value.name} ${item.name}`}
                          type="number"
                          className="w-20"
                          value={spec?.measurements[item.code] ?? 0}
                          onChange={(e) =>
                            setSpec(value.id, {
                              measurements: {
                                ...spec?.measurements,
                                [item.code]: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Label>
        이미지 주소 (한 줄에 하나, 첫 줄이 대표 이미지 · 없으면 기본 이미지)
        <textarea
          className="min-h-16 rounded-md border px-3 py-2 text-sm"
          value={form.imageUrlsText}
          onChange={(e) => set('imageUrlsText', e.target.value)}
        />
      </Label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={register.isPending}>
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
