/** GET /cart 한 줄. 주문 쪽 ID는 문자열 */
export type CartLine = {
  cartItemId: string
  optionId: string
  productId: string
  productName: string
  size: string
  childId: string | null
  quantity: number
  /** 지금 단가. 상품 정보가 없으면 null */
  unitPrice: number | null
  /** 판매 중 · 품절 아님 */
  purchasable: boolean
  lineAmount: number
}

export type Cart = {
  items: CartLine[]
  totalAmount: number
}
