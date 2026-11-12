/** GET /cart 한 줄 (백엔드 CartResponse.Line). 주문 쪽 ID는 문자열 */
export type CartLineDto = {
  cartItemId: string
  optionId: string
  /** 상품 복사본이 없는 줄(판매 종료 등)은 상품 필드가 모두 null (BE CartResponse.Line) */
  productId: string | null
  /** 상품 복사본의 판매자 ID. 복사본이 없는 줄(purchasable=false)은 null (BE #243) */
  sellerId: string | null
  /** 판매자의 지금 상호명 (BE #311). 판매자 정보가 아직 없으면 null */
  sellerName?: string | null
  productName: string | null
  /** 옵션 이름 (BE #221, 옛 주문상품은 null) */
  optionName: string | null
  /** 사이즈가 없는 상품은 null */
  size: string | null
  childId: string | null
  quantity: number
  unitPrice: number | null
  purchasable: boolean
  lineAmount: number
  /** 다른 곳(조르기 등)이 예약한 칸인지 (BE #998). 예약된 칸은 빼거나 수량을 바꾸면 409 */
  reserved: boolean
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
