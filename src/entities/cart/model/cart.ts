/** 화면용 장바구니 한 줄 */
export type CartLine = {
  id: string
  optionId: string
  /** 상품 복사본이 없는 줄은 null */
  productId: string | null
  /** 판매자 ID. 모르면 null ("판매자 정보 없음" 묶음) */
  sellerId: string | null
  /** 판매자 상호명. 모르면 null */
  sellerName: string | null
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
  /** 상품의 지금 사진. 없으면 null (상품 상세 대표 사진으로 대체) */
  thumbnailUrl: string | null
  /** 조르기 등에 예약된 칸 (빼거나 수량을 바꿀 수 없음) */
  reserved: boolean
}

export type Cart = {
  lines: CartLine[]
  totalAmount: number
}
