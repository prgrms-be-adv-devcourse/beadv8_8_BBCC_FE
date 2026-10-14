import type { ShippingAddressDto, ShippingAddressRequestDto } from '../api/address.dto'
import type { AddressForm, ShippingAddress } from './address'

export function toAddress(dto: ShippingAddressDto): ShippingAddress {
  return {
    id: String(dto.id),
    recipientName: dto.recipientName,
    phone: dto.recipientPhone,
    zipCode: dto.zipCode,
    roadAddress: dto.roadAddress,
    detailAddress: dto.detailAddress,
    fullAddress: [dto.roadAddress, dto.detailAddress].filter(Boolean).join(' '),
    isDefault: dto.isDefault,
  }
}

export function toAddressRequest(form: AddressForm): ShippingAddressRequestDto {
  return {
    recipientName: form.recipientName.trim(),
    recipientPhone: form.phone,
    zipCode: form.zipCode.trim(),
    roadAddress: form.roadAddress.trim(),
    detailAddress: form.detailAddress.trim() || null,
    isDefault: form.isDefault,
  }
}

/** 수정 폼 초기값 (상세 주소가 없으면 입력 칸용 빈 문자열) */
export function toAddressForm(address: ShippingAddress): AddressForm {
  return {
    recipientName: address.recipientName,
    phone: address.phone,
    zipCode: address.zipCode,
    roadAddress: address.roadAddress,
    detailAddress: address.detailAddress ?? '',
    isDefault: address.isDefault,
  }
}
