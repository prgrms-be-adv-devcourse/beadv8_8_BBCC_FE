import type { AddressForm, ShippingAddress } from './address'

const PHONE_PATTERN = /^010-\d{4}-\d{4}$/

/** 서버 검증과 같은 규칙. 문제가 없으면 null */
export function validateAddressForm(form: AddressForm): string | null {
  if (!form.recipientName.trim() || !form.zipCode.trim() || !form.roadAddress.trim()) {
    return '받는 분 · 우편번호 · 주소를 입력해 주세요.'
  }
  if (!PHONE_PATTERN.test(form.phone)) {
    return '연락처는 010-1234-5678 형식이어야 해요.'
  }
  return null
}

/** 기본 배송지를 맨 위로. 나머지는 받은 순서 그대로 */
export function defaultFirst(addresses: ShippingAddress[]) {
  return [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
}

/** 고른 배송지 → 없으면 기본 배송지 → 없으면 null */
export function pickShippingAddress(addresses: ShippingAddress[], selectedId: string | null) {
  return (
    addresses.find((address) => address.id === selectedId) ??
    addresses.find((address) => address.isDefault) ??
    null
  )
}
