import { apiClient } from '@/shared/api'
import type { ShippingAddressDto, ShippingAddressRequestDto } from './address.dto'

const PATH = '/members/me/addresses'

export const addressApi = {
  list: () => apiClient.get<ShippingAddressDto[]>(PATH).then((response) => response.data),
  create: (request: ShippingAddressRequestDto) =>
    apiClient.post<ShippingAddressDto>(PATH, request).then((response) => response.data),
  makeDefault: (addressId: string) => apiClient.patch(`${PATH}/${addressId}/default`),
  remove: (addressId: string) => apiClient.delete(`${PATH}/${addressId}`),
}
