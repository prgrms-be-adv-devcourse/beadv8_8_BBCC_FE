import type {
  Category,
  CategoryInputs,
  InputAttribute,
  ProductDetail,
  ProductOption,
  RegisterProductForm,
  StockReason,
  ValueCombo,
} from './product'

export function categoryNameOf(categoryId: string, categories: Category[]): string {
  return categories.find((category) => category.id === categoryId)?.name ?? ''
}

/** 카드 아래 줄: 카테고리 · 브랜드 (없는 값은 뺀다) */
/** 목록 카드 보조 문구: 상호명 · 품절 */
export function listItemMeta(item: { businessName: string | null; soldOut: boolean }): string {
  return [item.businessName, item.soldOut ? '품절' : null].filter(Boolean).join(' · ')
}

export function productMeta(product: { categoryName: string; brand: string | null }): string {
  return [product.categoryName, product.brand].filter(Boolean).join(' · ')
}

export function isOnSale(product: { status: string }): boolean {
  return product.status === 'ON_SALE'
}

/** 판매 시작 전이거나 중지된 상품은 판매를 (다시) 시작할 수 있다 */
export function canStartSale(product: { status: string }): boolean {
  return product.status === 'SALE_PENDING' || product.status === 'STOPPED'
}

export function canStopSale(product: { status: string }): boolean {
  return product.status === 'ON_SALE'
}

/** 옵션 · 가격 · 실측은 판매 시작 전에만 고칠 수 있다 (그 밖에는 BE가 409) */
export function canEditSaleInputs(product: { status: string }): boolean {
  return product.status === 'SALE_PENDING'
}

/** 살 수 없는 옵션은 고를 수 없다 (최종 판단은 서버 409) */
export function isSelectable(option: ProductOption): boolean {
  return !option.soldOut
}

export function findOption(product: ProductDetail, optionId: string | null): ProductOption | null {
  return product.options.find((option) => option.id === optionId) ?? null
}

/** 권장 키 범위 문구. 없으면 null */
export function heightRange(option: {
  minHeightCm: number | null
  maxHeightCm: number | null
}): string | null {
  return option.minHeightCm !== null && option.maxHeightCm !== null
    ? `${option.minHeightCm}~${option.maxHeightCm}cm`
    : null
}

/** 재고 표시: 적을 때만 수량, 없으면 품절 */
export function stockLabel(option: ProductOption): string | null {
  if (option.stockStatus === 'SOLD_OUT') return '품절'
  if (option.stockStatus === 'LOW' && option.stockQuantity !== null)
    return `${option.stockQuantity}개 남음`
  return null
}

/** FREE 사이즈는 권장 키가 선택이다 (BE SIZE-05) */
export function isFreeSize(name: string): boolean {
  return name.trim().toUpperCase() === 'FREE'
}

function combine(attributes: InputAttribute[], form: RegisterProductForm): ValueCombo[] {
  return attributes.reduce<ValueCombo[]>(
    (combos, attribute) => {
      const picked = attribute.values.filter((value) =>
        (form.optionValues[attribute.id] ?? []).includes(value.id),
      )
      return combos.flatMap((combo) =>
        picked.map((value) => ({
          key: [...combo.valueIds, value.id].join(','),
          valueIds: [...combo.valueIds, value.id],
          label: combo.label ? `${combo.label} / ${value.name}` : value.name,
        })),
      )
    },
    [{ key: '', valueIds: [], label: '' }],
  )
}

/** 고른 값의 모든 조합 (뺀 조합 포함). 값을 안 고른 항목이 있으면 빈 목록 */
function allOptionCombos(inputs: CategoryInputs, form: RegisterProductForm): ValueCombo[] {
  const combos = combine(inputs.optionAttributes, form)
  return combos.length === 1 && combos[0].key === '' ? [] : combos
}

/** 값 묶음을 쓰는 조합을 판매자가 모두 뺐는지 (조합이 아직 없으면 빼지 않은 것으로 본다) */
function isAllRemoved(inputs: CategoryInputs, form: RegisterProductForm, valueIds: string[]) {
  const using = allOptionCombos(inputs, form).filter((combo) =>
    valueIds.every((valueId) => combo.valueIds.includes(valueId)),
  )
  return using.length > 0 && using.every((combo) => form.removedCombos.includes(combo.key))
}

/** 옵션 = 옵션 항목마다 고른 값의 모든 조합 (항목 순서대로)에서 뺀 조합을 제외. 값을 안 고른 항목이 있으면 빈 목록 */
export function optionCombos(inputs: CategoryInputs, form: RegisterProductForm): ValueCombo[] {
  return allOptionCombos(inputs, form).filter((combo) => !form.removedCombos.includes(combo.key))
}

/** 뺀 조합의 수 (되돌리기 안내용) */
export function removedComboCount(inputs: CategoryInputs, form: RegisterProductForm): number {
  return allOptionCombos(inputs, form).filter((combo) => form.removedCombos.includes(combo.key))
    .length
}

/** 가격 묶음 = 가격 구분 항목에서 고른 값의 조합 (남은 옵션이 쓰는 것만). 가격 구분 항목이 없으면 묶음 하나(전체) */
export function priceGroups(inputs: CategoryInputs, form: RegisterProductForm): ValueCombo[] {
  const groups = combine(
    inputs.optionAttributes.filter((attribute) => attribute.priceAffecting),
    form,
  )
  return groups
    .filter((group) => group.key === '' || !isAllRemoved(inputs, form, group.valueIds))
    .map((group) => (group.key === '' ? { ...group, label: '전체 옵션' } : group))
}

/** 실측 · 권장 키를 넣을 사이즈 = 사이즈 항목에서 고른 값 (남은 옵션이 쓰는 것만, BE는 옵션에 없는 사이즈의 실측을 거절) */
export function sizeValues(inputs: CategoryInputs, form: RegisterProductForm) {
  const sizeAttribute = inputs.optionAttributes.find((attribute) => attribute.sizeRole)
  if (!sizeAttribute) return []
  const picked = form.optionValues[sizeAttribute.id] ?? []
  return sizeAttribute.values.filter(
    (value) => picked.includes(value.id) && !isAllRemoved(inputs, form, [value.id]),
  )
}

/** 서버(판매 시작 조건)와 같은 기준으로 미리 막는다. 문제가 없으면 null */
export function validateRegisterProductForm(
  inputs: CategoryInputs,
  form: RegisterProductForm,
): string | null {
  return validateBasics(inputs, form) ?? validateSaleInputs(inputs, form)
}

/** 수정: 판매 시작 뒤에는 옵션 · 가격 · 실측을 보내지 않으므로 상품명 · 정보 항목만 검사한다 */
export function validateProductUpdateForm(
  inputs: CategoryInputs,
  form: RegisterProductForm,
  product: { status: string },
): string | null {
  if (canEditSaleInputs(product)) return validateRegisterProductForm(inputs, form)
  return validateBasics(inputs, form)
}

function validateBasics(inputs: CategoryInputs, form: RegisterProductForm): string | null {
  const name = form.name.trim()
  if (!name) return '상품명을 입력해 주세요.'
  if (name.length > 100) return '상품명은 100자 이하로 입력해 주세요.'
  for (const attribute of inputs.infoAttributes) {
    const input = form.info[attribute.id]
    const filled = attribute.values.length > 0 ? !!input?.valueId : !!input?.text.trim()
    if (attribute.required && !filled) return `${attribute.name}을(를) 입력해 주세요.`
  }
  return null
}

function validateSaleInputs(inputs: CategoryInputs, form: RegisterProductForm): string | null {
  for (const attribute of inputs.optionAttributes) {
    if ((form.optionValues[attribute.id] ?? []).length === 0)
      return `${attribute.name}을(를) 하나 이상 골라 주세요.`
  }
  if (optionCombos(inputs, form).length === 0) return '옵션을 하나 이상 남겨 주세요.'
  const sizes = sizeValues(inputs, form)
  if (
    sizes.some((value) => isFreeSize(value.name)) &&
    sizes.some((value) => !isFreeSize(value.name))
  )
    return 'FREE와 숫자 사이즈는 함께 고를 수 없어요.'
  for (const combo of optionCombos(inputs, form)) {
    if (!((form.stocks[combo.key] ?? 0) >= 0)) return `${combo.label}: 재고는 0 이상이어야 해요.`
  }
  for (const group of priceGroups(inputs, form)) {
    if (!((form.prices[group.key] ?? 0) > 0)) return `${group.label}: 판매가를 입력해 주세요.`
  }
  for (const value of sizes) {
    const spec = form.sizeSpecs[value.id]
    const hasHeight = !!spec?.minHeightCm && !!spec?.maxHeightCm
    if (!isFreeSize(value.name) && !hasHeight) return `${value.name}: 권장 키를 입력해 주세요.`
    if (hasHeight && spec.minHeightCm > spec.maxHeightCm)
      return `${value.name}: 권장 키 범위를 확인해 주세요.`
    for (const item of inputs.measurementItems) {
      if (!((spec?.measurements[item.code] ?? 0) > 0))
        return `${value.name}: ${item.name}을(를) 입력해 주세요.`
    }
  }
  return null
}

/** 재고 조정 검증: 입고는 늘리기만, 불량 · 분실은 줄이기만, 조정 뒤 0 이상(재고를 알 때). 문제가 없으면 null */
/** BE InventoryAdjustmentRequest: 증감량 -1,000,000 ~ 1,000,000 */
export const STOCK_DELTA_MAX = 1_000_000

export function validateStockAdjustment(
  currentStock: number | null,
  delta: number,
  reason: StockReason,
): string | null {
  if (!Number.isInteger(delta)) return '수량은 정수로 입력해 주세요.'
  if (delta === 0) return '늘리거나 줄일 수량을 입력해 주세요.'
  if (Math.abs(delta) > STOCK_DELTA_MAX) return '한 번에 1,000,000개까지 조정할 수 있어요.'
  if (reason === 'RESTOCK' && delta < 0) return '입고는 재고를 늘릴 때만 써요.'
  if ((reason === 'DEFECTIVE' || reason === 'LOST') && delta > 0)
    return '불량 · 분실은 재고를 줄일 때만 써요.'
  if (currentStock !== null && currentStock + delta < 0)
    return `재고는 0보다 적어질 수 없어요 (지금 ${currentStock}개).`
  return null
}

/** 재고 적음 기준 (이하면 판매자 화면에서 강조) */
export const LOW_STOCK_THRESHOLD = 5

export type StockLevel = 'OUT' | 'LOW' | 'OK'

/** 재고 수준: 0 품절 · 5개 이하 적음 · 그 밖은 충분 */
export function stockLevelOf(stock: number): StockLevel {
  if (stock <= 0) return 'OUT'
  if (stock <= LOW_STOCK_THRESHOLD) return 'LOW'
  return 'OK'
}

/** 판매자 상품 목록 거르기: 이름 찾기 + 재고 적은 것만 (품절 포함) */
export function filterSellerProducts<T extends { name: string; totalStock: number }>(
  products: T[],
  { keyword, lowStockOnly }: { keyword: string; lowStockOnly: boolean },
): T[] {
  const word = keyword.trim().toLowerCase()
  return products.filter(
    (product) =>
      (!word || product.name.toLowerCase().includes(word)) &&
      (!lowStockOnly || stockLevelOf(product.totalStock) !== 'OK'),
  )
}
