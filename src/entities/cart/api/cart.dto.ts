/** GET /cart 한 줄 (백엔드 CartResponse.Line). 주문 쪽 ID는 문자열 */
export type CartLineDto = {
  cartItemId: string
  optionId: string
  productId: string
  productName: string
  size: string
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
