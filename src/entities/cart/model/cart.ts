/** 화면용 장바구니 한 줄 */
export type CartLine = {
  id: string
  optionId: string
  productId: string
  /** 판매자 ID. 모르면 null ("판매자 정보 없음" 묶음) */
  sellerId: string | null
  productName: string
  optionName: string | null
  size: string | null
  /** 입을 자녀 (선택) */
  childId: string | null
  quantity: number
  /** 지금 단가. 상품 정보가 없으면 null */
  unitPrice: number | null
  /** 판매 중 · 품절 아님 */
  purchasable: boolean
  lineAmount: number
}

export type Cart = {
  lines: CartLine[]
  totalAmount: number
}
