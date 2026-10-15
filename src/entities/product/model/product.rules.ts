import type {
  ProductDetail,
  ProductEditForm,
  ProductOption,
  RegisterProductForm,
  StockReason,
} from './product'

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

/** 품절 옵션은 고를 수 없다 (최종 판단은 서버 409) */
export function isSelectable(option: ProductOption): boolean {
  return !option.soldOut
}

export function findOption(product: ProductDetail, optionId: string | null): ProductOption | null {
  return product.options.find((option) => option.id === optionId) ?? null
}

export function optionName(option: ProductOption): string {
  return `${option.color} / ${option.material} / ${option.size}`
}

export function describeSizes(product: ProductDetail): string {
  return product.options
    .map(
      (option) =>
        `${option.size}(${option.minHeightCm}~${option.maxHeightCm}cm, 재고 ${option.stock})`,
    )
    .join(' · ')
}

/** 문제가 없으면 null */
export function validateRegisterProductForm(form: RegisterProductForm): string | null {
  if (!form.name.trim()) return '상품명을 입력해 주세요.'
  if (form.sizes.length === 0) return '사이즈를 하나 이상 넣어 주세요.'
  for (const row of form.sizes) {
    if (!row.size.trim()) return '사이즈 이름을 입력해 주세요.'
    if (!(row.minHeightCm > 0 && row.minHeightCm <= row.maxHeightCm))
      return `${row.size}: 권장 키 범위를 확인해 주세요.`
    if (!(row.price > 0)) return `${row.size}: 가격을 입력해 주세요.`
    if (row.stock < 0) return `${row.size}: 재고는 0 이상이어야 해요.`
  }
  return null
}

/** 재고 조정 검증: 입고는 늘리기만, 불량 · 분실은 줄이기만, 조정 뒤 0 이상. 문제가 없으면 null */
export function validateStockAdjustment(
  currentStock: number,
  delta: number,
  reason: StockReason,
): string | null {
  if (!Number.isInteger(delta)) return '수량은 정수로 입력해 주세요.'
  if (delta === 0) return '늘리거나 줄일 수량을 입력해 주세요.'
  if (reason === 'RESTOCK' && delta < 0) return '입고는 재고를 늘릴 때만 써요.'
  if ((reason === 'DEFECTIVE' || reason === 'LOST') && delta > 0)
    return '불량 · 분실은 재고를 줄일 때만 써요.'
  if (currentStock + delta < 0) return `재고는 0보다 적어질 수 없어요 (지금 ${currentStock}개).`
  return null
}

export function validateProductEditForm(form: ProductEditForm): string | null {
  if (!form.name.trim()) return '상품명을 입력해 주세요.'
  if (Object.values(form.prices).some((price) => !(price >= 1)))
    return '가격은 1원 이상이어야 해요.'
  return null
}
