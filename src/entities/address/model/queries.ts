import { useQuery } from '@tanstack/react-query'
import { addressApi } from '../api/address-api'
import { toAddress } from './address.mapper'

export const addressKeys = {
  all: ['addresses'] as const,
}

export function useAddressesQuery() {
  return useQuery({
    queryKey: addressKeys.all,
    queryFn: addressApi.list,
    select: (list) => list.map(toAddress),
  })
}
