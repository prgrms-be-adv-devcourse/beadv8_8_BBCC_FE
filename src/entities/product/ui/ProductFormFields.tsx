import type { ReactNode } from 'react'
import { Input, Select, Textarea } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type {
  CategoryInputs,
  RegisterProductForm,
  SizeSpecInput,
  ValueCombo,
} from '../model/product'
import { optionCombos, priceGroups, removedComboCount, sizeValues } from '../model/product.rules'
import { OptionValuePicker } from './OptionValuePicker'
import { ProductOptionTable } from './ProductOptionTable'
import { SizeSpecTable } from './SizeSpecTable'

const EMPTY_SPEC: SizeSpecInput = { minHeightCm: 0, maxHeightCm: 0, measurements: {} }

type ProductFormFieldsProps = {
  inputs: CategoryInputs
  form: RegisterProductForm
  onChange: (form: RegisterProductForm) => void
  /** 사진 입력 칸: 대표 · 상세 (사진 업로드 기능) */
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
      <Label>
        상품 설명
        <Textarea
          placeholder="상품 설명을 입력해 주세요"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </Label>

      <div className="grid gap-3 md:grid-cols-2">{images}</div>

      <InfoFields inputs={inputs} info={form.info} onChange={(info) => set('info', info)} />

      <fieldset disabled={isSaleInputsLocked} className="space-y-4">
        {isSaleInputsLocked && (
          <p className="text-muted-foreground text-sm">
            판매를 시작한 상품은 옵션 · 판매가 · 실측을 바꿀 수 없어요. 재고는 재고 조정으로 바꿔요.
          </p>
        )}
        {inputs.optionAttributes.map((attribute) => (
          <div key={attribute.id} className="space-y-1">
            <OptionValuePicker
              attribute={attribute}
              selected={form.optionValues[attribute.id] ?? []}
              onToggle={(valueId) => toggleValue(attribute.id, valueId)}
            />
            {attribute.sizeRole && (
              <p className="text-muted-foreground text-xs">
                FREE와 숫자 사이즈는 함께 고를 수 없어요.
              </p>
            )}
          </div>
        ))}
        <ProductOptionTable
          combos={optionCombos(inputs, form)}
          stocks={form.stocks}
          skuCodes={form.skuCodes}
          fixedStocks={fixedStocks}
          removedCount={removedComboCount(inputs, form)}
          onStock={(key, stock) => set('stocks', { ...form.stocks, [key]: stock })}
          onSkuCode={(key, skuCode) => set('skuCodes', { ...form.skuCodes, [key]: skuCode })}
          onRemove={(key) => set('removedCombos', [...form.removedCombos, key])}
          onRestore={() => set('removedCombos', [])}
        />
        <PriceFields
          groups={priceGroups(inputs, form)}
          prices={form.prices}
          onPrice={(key, price) => set('prices', { ...form.prices, [key]: price })}
        />
        {sizes.length > 0 && (
          <div className="space-y-1">
            <SizeSpecTable
              sizes={sizes}
              measurementItems={inputs.measurementItems}
              specs={form.sizeSpecs}
              onChange={setSpec}
            />
            <p className="text-muted-foreground text-xs">
              판매를 시작하려면 사이즈마다 권장 키와 실측을 모두 입력해야 해요.
            </p>
          </div>
        )}
      </fieldset>
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
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">
        소재는 옵션이 아니라 상품 정보예요. 목록에 없는 소재는 &lsquo;기타&rsquo;를 고르고 혼용률에
        적어 주세요.
      </p>
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
    </div>
  )
}

type PriceFieldsProps = {
  groups: ValueCombo[]
  prices: Record<string, number>
  onPrice: (groupKey: string, price: number) => void
}

function PriceFields({ groups, prices, onPrice }: PriceFieldsProps) {
  if (groups.length === 0) return null
  const isSinglePrice = groups.length === 1 && groups[0].key === ''
  return (
    <div className="space-y-1 md:max-w-sm">
      <p className="text-sm font-medium">판매가 (원)</p>
      {groups.map((group) => (
        <Label key={group.key} className="flex-row items-center justify-between gap-2">
          <span className="text-sm font-normal">{group.label}</span>
          <Input
            aria-label={`${group.label} 판매가`}
            type="number"
            min={1}
            className="w-32"
            value={prices[group.key] ?? 0}
            onChange={(e) => onPrice(group.key, Number(e.target.value))}
          />
        </Label>
      ))}
      <p className="text-muted-foreground text-xs">
        {isSinglePrice
          ? '모든 옵션에 같은 판매가가 들어가요.'
          : '같은 묶음의 옵션에는 같은 판매가가 들어가요.'}
      </p>
    </div>
  )
}
