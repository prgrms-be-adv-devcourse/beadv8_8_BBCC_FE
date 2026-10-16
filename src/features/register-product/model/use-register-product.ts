import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  productApi,
  productKeys,
  toRegisterProductRequest,
  type CategoryInputs,
  type RegisterProductForm,
} from '@/entities/product'
import { toast } from '@/shared/lib'
import { runWithAction } from '@/shared/api'

/** 상품 등록 → 판매 시작 전(SALE_PENDING). 응답의 productId로 판매를 시작한다 */
export function useRegisterProduct(inputs: CategoryInputs) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: RegisterProductForm) =>
      runWithAction('상품 등록', () => productApi.register(toRegisterProductRequest(inputs, form))),
    onSuccess: () => {
      toast('상품을 등록했어요')
      return queryClient.invalidateQueries({ queryKey: productKeys.sellerList })
    },
  })
}

/** 판매 시작 → 상품이 product.changed 발행 → 추천 · 주문이 복사본 저장 */
export function useStartSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) =>
      runWithAction('판매 시작', () => productApi.startSale(productId)),
    onSuccess: () => {
      toast('판매를 시작했어요 · 이제 구매자에게 보여요')
      return queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}
