/** 화면용 배송지 */
export type ShippingAddress = {
  id: string
  recipientName: string
  phone: string
  zipCode: string
  roadAddress: string
  detailAddress: string | null
  /** 도로명 + 상세 주소 */
  fullAddress: string
  isDefault: boolean
}

/** 배송지 입력 폼 값 */
export type AddressForm = {
  recipientName: string
  phone: string
  zipCode: string
  roadAddress: string
  detailAddress: string
  isDefault: boolean
}
