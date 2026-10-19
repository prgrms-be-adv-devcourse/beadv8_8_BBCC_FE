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

/**
 * 등록하고 판매 시작: 등록(SALE_PENDING) 뒤 이어서 판매를 시작한다.
 * 판매 시작만 실패하면 상품은 판매 대기로 남으므로 등록 결과와 그 오류를 함께 돌려준다
 */
export function useRegisterAndStartSale(inputs: CategoryInputs) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (form: RegisterProductForm) => {
      const registered = await runWithAction('상품 등록', () =>
        productApi.register(toRegisterProductRequest(inputs, form)),
      )
      try {
        await runWithAction('판매 시작', () => productApi.startSale(registered.productId))
        return { registered, startError: null }
      } catch (startError) {
        return { registered, startError }
      }
    },
    onSuccess: ({ startError }) => {
      toast(
        startError
          ? '상품을 등록했지만 판매를 시작하지 못했어요'
          : '상품을 등록하고 판매를 시작했어요 · 이제 구매자에게 보여요',
      )
      return queryClient.invalidateQueries({ queryKey: productKeys.all })
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
