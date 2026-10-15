import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import {
  optionCombos,
  priceGroups,
  sizeValues,
  validateRegisterProductForm,
  type CategoryInputs,
  type RegisterProductForm as RegisterProductFormValue,
  type SizeSpecInput,
} from '@/entities/product'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { demoRegisterForm } from '../config/demo-product'
import { useRegisterProduct } from '../model/use-register-product'
import { OptionValuePicker } from './OptionValuePicker'
import { SizeSpecTable } from './SizeSpecTable'
import { StartSaleButton } from './StartSaleButton'

const EMPTY_SPEC: SizeSpecInput = { minHeightCm: 0, maxHeightCm: 0, measurements: {} }

type ProductFieldsProps = { inputs: CategoryInputs; productHref: (productId: string) => string }

/** 카테고리 입력 항목으로 만든 등록 폼 본문 + 등록 결과(판매 시작 → 상세) */
export function ProductFields({ inputs, productHref }: ProductFieldsProps) {
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
        <OptionValuePicker
          key={attribute.id}
          attribute={attribute}
          selected={form.optionValues[attribute.id] ?? []}
          onToggle={(valueId) => toggleValue(attribute.id, valueId)}
        />
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
        <SizeSpecTable
          sizes={sizes}
          measurementItems={inputs.measurementItems}
          specs={form.sizeSpecs}
          onChange={setSpec}
        />
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
