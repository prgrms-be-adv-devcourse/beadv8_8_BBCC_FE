import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  productApi,
  productKeys,
  toRegisterProductRequest,
  type RegisterProductForm,
} from '@/entities/product'
import { runWithAction } from '@/shared/api'

export function useRegisterProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: RegisterProductForm) =>
      runWithAction('상품 등록', () => productApi.register(toRegisterProductRequest(form))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.sellerList }),
  })
}

/** 판매 시작 → 상품이 product.changed 발행 → 추천 · 주문이 복사본 저장 */
export function useStartSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) =>
      runWithAction('판매 시작', () => productApi.startSale(productId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  })
}
