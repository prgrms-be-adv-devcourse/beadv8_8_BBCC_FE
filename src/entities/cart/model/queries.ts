import { useQuery } from '@tanstack/react-query'
import { cartApi, childCartApi } from '../api/cart-api'
import { toCart } from './cart.mapper'

export const cartKeys = {
  mine: ['cart'] as const,
  /** 자녀 토큰으로 본 내 장바구니. 보호자 장바구니와 캐시를 나눈다 */
  child: ['cart', 'child'] as const,
}

/** 로그인한 자녀의 장바구니 (같은 GET /cart, 자녀 토큰) */
export function useChildCartQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: cartKeys.child,
    queryFn: childCartApi.get,
    select: toCart,
    enabled,
    gcTime: 0,
    staleTime: 0,
  })
}

export function useCartQuery() {
  return useQuery({ queryKey: cartKeys.mine, queryFn: cartApi.get, select: toCart })
}

/**
 * 장바구니 줄 수 (머리말 배지). 이미 불러온 장바구니만 읽고 직접 부르지 않는다
 * (머리말은 API를 부르지 않는다 — 흐름 기록에 화면 동작만 남기려고)
 */
export function useCartCount(): number | null {
  const query = useQuery({
    queryKey: cartKeys.mine,
    queryFn: cartApi.get,
    select: (dto) => toCart(dto).lines.length,
    enabled: false,
  })
  return query.data ?? null
}
