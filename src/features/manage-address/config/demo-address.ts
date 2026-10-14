import type { AddressForm } from '@/entities/address'

/** 기획서 7.1 시연 배송지 1 */
export const DEMO_ADDRESS: AddressForm = {
  recipientName: '홍길동',
  phone: '010-0000-0000',
  zipCode: '04524',
  roadAddress: '서울시 테스트로 1',
  detailAddress: '',
  isDefault: true,
}
