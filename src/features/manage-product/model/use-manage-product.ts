import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  productApi,
  productKeys,
  toProductUpdateRequest,
  type CategoryInputs,
  type RegisterProductForm,
  type SellerProductDetail,
  type StockReason,
} from '@/entities/product'
import { getErrorStatus, runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'

function useInvalidateProducts(message: string) {
  const queryClient = useQueryClient()
  return () => {
    toast(message)
    return queryClient.invalidateQueries({ queryKey: productKeys.all })
  }
}

/**
 * 상품 수정(PUT, 전체 값) → product.changed (추천 · 주문 복사본 갱신).
 * 409(그사이 다른 수정 · 판매 상태 변경)면 상세를 다시 불러와 최신 version · 상태로 다시 저장하게 한다 (자동 재시도 없음)
 */
export function useUpdateProduct(product: SellerProductDetail) {
  const queryClient = useQueryClient()
  const onSuccess = useInvalidateProducts('상품을 수정했어요')
  const mutation = useMutation({
    mutationFn: ({ inputs, form }: { inputs: CategoryInputs; form: RegisterProductForm }) =>
      runWithAction('상품 수정', () =>
        productApi.updateProduct(product.id, toProductUpdateRequest(inputs, form, product)),
      ),
    onSuccess,
    onError: (error) => {
      if (getErrorStatus(error) !== 409) return
      return queryClient.invalidateQueries({ queryKey: productKeys.sellerDetail(product.id) })
    },
  })
  return { ...mutation, needsRecheck: getErrorStatus(mutation.error) === 409 }
}

/** 판매 중지 → 목록 · 추천에서 빠지고 장바구니에서 구매 불가 */
export function useStopSale(productId: string) {
  const onSuccess = useInvalidateProducts('판매를 중지했어요')
  return useMutation({
    mutationFn: () => runWithAction('판매 중지', () => productApi.stopSale(productId)),
    onSuccess,
  })
}

/** 재고 조정 (증감 + 사유). 0이 되면 품절 */
export function useAdjustStock(optionId: string) {
  const onSuccess = useInvalidateProducts('재고를 조정했어요')
  return useMutation({
    mutationFn: ({ delta, reason }: { delta: number; reason: StockReason }) =>
      runWithAction('재고 조정', () =>
        productApi.adjustStock(optionId, { deltaQuantity: delta, reason }),
      ),
    onSuccess,
  })
}

/** 관리자: 정책 위반 상품 판매 중지 */
export function useAdminStopSale(productId: string) {
  const onSuccess = useInvalidateProducts('상품 판매를 중지했어요')
  return useMutation({
    mutationFn: () => runWithAction('관리자 판매 중지', () => productApi.adminStopSale(productId)),
    onSuccess,
  })
}
