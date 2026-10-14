import { arr, apiClient, expectShape } from '@/shared/api'
import type { ShippingAddressDto, ShippingAddressRequestDto } from './address.dto'
import { addressShape } from './address.shape'

const PATH = '/members/me/addresses'

export const addressApi = {
  list: () => apiClient.get<ShippingAddressDto[]>(PATH).then(expectShape(arr(addressShape))),
  create: (request: ShippingAddressRequestDto) =>
    apiClient.post<ShippingAddressDto>(PATH, request).then(expectShape(addressShape)),
  /** 전체 교체 */
  update: (addressId: string, request: ShippingAddressRequestDto) =>
    apiClient
      .patch<ShippingAddressDto>(`${PATH}/${addressId}`, request)
      .then(expectShape(addressShape)),
  makeDefault: (addressId: string) => apiClient.patch(`${PATH}/${addressId}/default`),
  remove: (addressId: string) => apiClient.delete(`${PATH}/${addressId}`),
}
