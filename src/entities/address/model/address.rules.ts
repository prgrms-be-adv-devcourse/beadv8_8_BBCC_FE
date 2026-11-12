import type { AddressForm, ShippingAddress } from './address'

/** 백엔드 MemberPolicy.RECIPIENT_PHONE_REGEX (휴대폰 · 지역번호 모두) */
const PHONE_PATTERN = /^0[0-9]{1,2}-[0-9]{3,4}-[0-9]{4}$/

/** 백엔드 MemberPolicy 글자 수 상한. 보내는 값(앞뒤 공백 제거)으로 센다 */
const MAX_LENGTHS = [
  ['recipientName', '받는 분은', 50],
  ['zipCode', '우편번호는', 10],
  ['roadAddress', '주소는', 200],
  ['detailAddress', '상세 주소는', 100],
] as const

/** 서버 검증과 같은 규칙. 문제가 없으면 null */
export function validateAddressForm(form: AddressForm): string | null {
  if (!form.recipientName.trim() || !form.zipCode.trim() || !form.roadAddress.trim()) {
    return '받는 분 · 우편번호 · 주소를 입력해 주세요.'
  }
  const tooLong = MAX_LENGTHS.find(([key, , max]) => form[key].trim().length > max)
  if (tooLong) {
    const [, label, max] = tooLong
    return `${label} ${max}자까지예요.`
  }
  if (!PHONE_PATTERN.test(form.phone)) {
    return '연락처는 010-1234-5678 · 02-123-4567처럼 하이픈을 넣어 입력해 주세요.'
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
