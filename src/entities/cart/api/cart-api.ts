import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { Cart } from '../model/types'

export const cartKeys = {
  mine: ['cart'] as const,
}

export const cartApi = {
  get: () => apiClient.get<Cart>('/cart').then((response) => response.data),
}

export function useCartQuery() {
  return useQuery({ queryKey: cartKeys.mine, queryFn: cartApi.get })
}
