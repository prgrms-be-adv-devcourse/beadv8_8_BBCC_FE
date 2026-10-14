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
