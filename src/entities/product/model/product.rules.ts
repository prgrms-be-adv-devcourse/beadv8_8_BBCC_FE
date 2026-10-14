import type { ProductDetail, ProductOption, RegisterProductForm } from './product'

export function isOnSale(product: { status: string }): boolean {
  return product.status === 'ON_SALE'
}

export function canStartSale(product: { status: string }): boolean {
  return product.status === 'SALE_PENDING'
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
