import { useQuery } from '@tanstack/react-query'
import { cartApi } from '../api/cart-api'
import { toCart } from './cart.mapper'

export const cartKeys = {
  mine: ['cart'] as const,
}

export function useCartQuery() {
  return useQuery({ queryKey: cartKeys.mine, queryFn: cartApi.get, select: toCart })
}
