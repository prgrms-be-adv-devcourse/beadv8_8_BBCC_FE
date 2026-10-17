import type { ReactNode } from 'react'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { CategoryInputs, RegisterProductForm, SizeSpecInput } from '../model/product'
import { optionCombos, priceGroups, sizeValues } from '../model/product.rules'
import { OptionValuePicker } from './OptionValuePicker'
import { SizeSpecTable } from './SizeSpecTable'

const EMPTY_SPEC: SizeSpecInput = { minHeightCm: 0, maxHeightCm: 0, measurements: {} }

type ProductFormFieldsProps = {
  inputs: CategoryInputs
  form: RegisterProductForm
  onChange: (form: RegisterProductForm) => void
  /** 사진 입력 칸 (사진 업로드 기능) */
  images: ReactNode
  /** 판매를 시작한 상품은 옵션 · 가격 · 실측을 바꿀 수 없다 (수정) */
  isSaleInputsLocked?: boolean
  /** 이미 있는 옵션 조합 → 지금 재고. 재고는 재고 조정으로만 바꾸므로 입력 칸 대신 보여만 준다 (수정) */
  fixedStocks?: Record<string, number>
}

/** 상품 등록 · 수정이 함께 쓰는 입력 칸: 카테고리 입력 항목으로 만든다 */
export function ProductFormFields({
  inputs,
  form,
  onChange,
  images,
  isSaleInputsLocked = false,
  fixedStocks = {},
}: ProductFormFieldsProps) {
  const sizes = sizeValues(inputs, form)
  const set = <K extends keyof RegisterProductForm>(key: K, value: RegisterProductForm[K]) =>
    onChange({ ...form, [key]: value })

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
      [valueId]: { ...(form.sizeSpecs[valueId] ?? EMPTY_SPEC), ...patch },
    })

  return (
    <>
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

      <InfoFields inputs={inputs} info={form.info} onChange={(info) => set('info', info)} />

      <fieldset disabled={isSaleInputsLocked} className="space-y-4">
        {isSaleInputsLocked && (
          <p className="text-muted-foreground text-sm">
            판매를 시작한 상품은 옵션 · 판매가 · 실측을 바꿀 수 없어요. 재고는 재고 조정으로 바꿔요.
          </p>
        )}
        {inputs.optionAttributes.map((attribute) => (
          <OptionValuePicker
            key={attribute.id}
            attribute={attribute}
            selected={form.optionValues[attribute.id] ?? []}
            onToggle={(valueId) => toggleValue(attribute.id, valueId)}
          />
        ))}
        <StockAndPriceFields
          inputs={inputs}
          form={form}
          fixedStocks={fixedStocks}
          onStock={(key, stock) => set('stocks', { ...form.stocks, [key]: stock })}
          onPrice={(key, price) => set('prices', { ...form.prices, [key]: price })}
        />
        {sizes.length > 0 && (
          <SizeSpecTable
            sizes={sizes}
            measurementItems={inputs.measurementItems}
            specs={form.sizeSpecs}
            onChange={setSpec}
          />
        )}
      </fieldset>

      {images}
    </>
  )
}

type InfoFieldsProps = {
  inputs: CategoryInputs
  info: RegisterProductForm['info']
  onChange: (info: RegisterProductForm['info']) => void
}

function InfoFields({ inputs, info, onChange }: InfoFieldsProps) {
  if (inputs.infoAttributes.length === 0) return null
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {inputs.infoAttributes.map((attribute) => {
        const input = info[attribute.id] ?? { valueId: '', text: '' }
        const update = (patch: Partial<typeof input>) =>
          onChange({ ...info, [attribute.id]: { ...input, ...patch } })
        return (
          <Label key={attribute.id}>
            {attribute.name}
            {attribute.required && ' *'}
            {attribute.values.length > 0 ? (
              <Select value={input.valueId} onChange={(e) => update({ valueId: e.target.value })}>
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
  )
}

type StockAndPriceFieldsProps = {
  inputs: CategoryInputs
  form: RegisterProductForm
  fixedStocks: Record<string, number>
  onStock: (comboKey: string, stock: number) => void
  onPrice: (groupKey: string, price: number) => void
}

function StockAndPriceFields({
  inputs,
  form,
  fixedStocks,
  onStock,
  onPrice,
}: StockAndPriceFieldsProps) {
  const combos = optionCombos(inputs, form)
  if (combos.length === 0) return null
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {Object.keys(fixedStocks).length > 0
            ? '옵션 · 재고 (새 옵션은 처음 재고)'
            : '옵션 · 처음 재고'}
        </p>
        {combos.map((combo) =>
          combo.key in fixedStocks ? (
            <p key={combo.key} className="flex items-center justify-between gap-2 text-sm">
              <span>{combo.label}</span>
              <span className="text-muted-foreground">재고 {fixedStocks[combo.key]}</span>
            </p>
          ) : (
            <Label key={combo.key} className="flex-row items-center justify-between gap-2">
              <span className="text-sm font-normal">{combo.label}</span>
              <Input
                aria-label={`${combo.label} 재고`}
                type="number"
                min={0}
                className="w-24"
                value={form.stocks[combo.key] ?? 0}
                onChange={(e) => onStock(combo.key, Number(e.target.value))}
              />
            </Label>
          ),
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">판매가 (원)</p>
        {priceGroups(inputs, form).map((group) => (
          <Label key={group.key} className="flex-row items-center justify-between gap-2">
            <span className="text-sm font-normal">{group.label}</span>
            <Input
              aria-label={`${group.label} 판매가`}
              type="number"
              min={1}
              className="w-32"
              value={form.prices[group.key] ?? 0}
              onChange={(e) => onPrice(group.key, Number(e.target.value))}
            />
          </Label>
        ))}
      </div>
    </div>
  )
}
