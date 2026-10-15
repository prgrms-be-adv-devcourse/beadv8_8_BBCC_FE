/** GET /cart 한 줄 (백엔드 CartResponse.Line). 주문 쪽 ID는 문자열 */
export type CartLineDto = {
  cartItemId: string
  optionId: string
  productId: string
  /** 상품 복사본의 판매자 ID. 복사본이 없는 줄(purchasable=false)은 null (BE #243) */
  sellerId: string | null
  /** 판매자의 지금 상호명 (BE #311). 판매자 정보가 아직 없으면 null */
  sellerName?: string | null
  productName: string
  /** 옵션 이름 (BE #221, 옛 주문상품은 null) */
  optionName: string | null
  /** 사이즈가 없는 상품은 null */
  size: string | null
  childId: string | null
  quantity: number
  unitPrice: number | null
  purchasable: boolean
  lineAmount: number
}

export type CartDto = {
  items: CartLineDto[]
  totalAmount: number
}

/** POST /cart/items */
export type AddCartItemRequestDto = {
  optionId: number
  childId: number | null
  quantity: number
}
