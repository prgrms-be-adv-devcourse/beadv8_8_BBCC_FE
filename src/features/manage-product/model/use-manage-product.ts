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

/** 판매자 등록 취소 → product.changed (목록 · 추천에서 빠지고 살 수 없다). 판매자는 되돌릴 수 없다 */
export function useDelist(productId: string) {
  const onSuccess = useInvalidateProducts('상품을 등록 취소했어요')
  return useMutation({
    mutationFn: () => runWithAction('등록 취소', () => productApi.delist(productId)),
    onSuccess,
  })
}

/** 관리자: 등록 취소한 상품을 판매 중지로 되돌린다 (상품 번호를 넣어 부른다. 등록 취소한 상품이 아니면 409) */
export function useAdminRevertDelist() {
  const onSuccess = useInvalidateProducts('등록 취소를 되돌렸어요')
  return useMutation({
    mutationFn: (productId: string) =>
      runWithAction('등록 취소 되돌리기', () => productApi.adminRevertDelist(productId)),
    onSuccess,
  })
}
