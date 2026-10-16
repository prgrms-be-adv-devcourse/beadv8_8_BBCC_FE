import {
  optionCombos,
  priceGroups,
  sizeValues,
  type CategoryInputs,
  type InputAttribute,
  type RegisterProductForm,
} from '@/entities/product'

// 시연 값(기획서 7.1 상품 A): 네이비 · 110 / 120 · 면, 옵션마다 재고 10 · 25,000원.
// 카테고리 입력 항목에 그 값이 없으면 첫 값으로 채운다

const DEMO_SIZES: Record<string, [number, number]> = { '110': [105, 115], '120': [115, 125] }
/** BE 테스트 기준 데이터의 상의 실측 (110 · 120) */
const DEMO_MEASUREMENTS: Record<string, [number, number]> = {
  TOTAL_LENGTH: [42, 45],
  SHOULDER_WIDTH: [30, 32],
  CHEST_WIDTH: [34, 36],
  SLEEVE_LENGTH: [38, 41],
}

function pick(attribute: InputAttribute, names: string[], count: number): string[] {
  const named = attribute.values.filter((value) => names.includes(value.name))
  const chosen = named.length > 0 ? named : attribute.values.slice(0, count)
  return chosen.map((value) => value.id)
}

export function demoRegisterForm(inputs: CategoryInputs): RegisterProductForm {
  const info = Object.fromEntries(
    inputs.infoAttributes.map((attribute) => [
      attribute.id,
      attribute.values.length > 0
        ? { valueId: pick(attribute, ['면'], 1)[0] ?? '', text: '' }
        : { valueId: '', text: /COMPOSITION/i.test(attribute.code) ? '면 100%' : '' },
    ]),
  )
  const optionValues = Object.fromEntries(
    inputs.optionAttributes.map((attribute) => [
      attribute.id,
      attribute.sizeRole ? pick(attribute, ['110', '120'], 2) : pick(attribute, ['네이비'], 1),
    ]),
  )
  const form: RegisterProductForm = {
    name: '데일리 맨투맨',
    brand: '키들리',
    imageUrlsText: '',
    categoryId: inputs.categoryId,
    info,
    optionValues,
    stocks: {},
    prices: {},
    sizeSpecs: {},
  }
  for (const combo of optionCombos(inputs, form)) form.stocks[combo.key] = 10
  for (const group of priceGroups(inputs, form)) form.prices[group.key] = DEMO_PRICE
  sizeValues(inputs, form).forEach((value, index) => {
    const [min, max] = DEMO_SIZES[value.name] ?? [100 + index * 10, 110 + index * 10]
    form.sizeSpecs[value.id] = {
      minHeightCm: min,
      maxHeightCm: max,
      measurements: Object.fromEntries(
        inputs.measurementItems.map((item) => [
          item.code,
          DEMO_MEASUREMENTS[item.code]?.[index] ?? 30 + index * 2,
        ]),
      ),
    }
  })
  return form
}

/** 시연 상품 옵션 가격 (자동 시연 시작 전 점검: 보호자 예치금이 이만큼 있어야 주문이 된다) */
export const DEMO_PRICE = 25000

/** 카테고리 기본값: 시연 상품의 카테고리(상의), 없으면 첫 카테고리 */
export function demoCategoryId(categories: { id: string; name: string }[]): string {
  return (categories.find((category) => category.name === '상의') ?? categories[0])?.id ?? ''
}
