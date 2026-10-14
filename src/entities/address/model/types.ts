/** GET /members/me/addresses */
export type ShippingAddress = {
  id: number
  recipientName: string
  recipientPhone: string
  zipCode: string
  roadAddress: string
  detailAddress: string | null
  isDefault: boolean
}

/** 배송지 등록 · 수정 요청 (수정은 전체 교체). isDefault=false는 기본 배송지를 바꾸지 않는다 */
export type ShippingAddressRequest = {
  recipientName: string
  recipientPhone: string
  zipCode: string
  roadAddress: string
  detailAddress: string | null
  isDefault: boolean
}
