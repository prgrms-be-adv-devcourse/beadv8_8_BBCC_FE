import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { ShippingAddress } from '../model/types'

export const addressKeys = {
  all: ['addresses'] as const,
}

export const addressApi = {
  list: () =>
    apiClient.get<ShippingAddress[]>('/members/me/addresses').then((response) => response.data),
}

export function useAddressesQuery() {
  return useQuery({ queryKey: addressKeys.all, queryFn: addressApi.list })
}
