import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  productApi,
  productKeys,
  toUpdateProductRequest,
  type ProductEditForm,
  type StockReason,
} from '@/entities/product'
import { runWithAction } from '@/shared/api'

function useInvalidateProducts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: productKeys.all })
}

/** 상품 수정 → product.changed (추천 · 주문 복사본 갱신) */
export function useUpdateProduct(productId: string) {
  const onSuccess = useInvalidateProducts()
  return useMutation({
    mutationFn: (form: ProductEditForm) =>
      runWithAction('상품 수정', () => productApi.update(productId, toUpdateProductRequest(form))),
    onSuccess,
  })
}

/** 판매 중지 → 목록 · 추천에서 빠지고 장바구니에서 구매 불가 */
export function useStopSale(productId: string) {
  const onSuccess = useInvalidateProducts()
  return useMutation({
    mutationFn: () => runWithAction('판매 중지', () => productApi.stopSale(productId)),
    onSuccess,
  })
}

/** 재고 조정 (증감 + 사유). 0이 되면 품절 */
export function useAdjustStock(optionId: string) {
  const onSuccess = useInvalidateProducts()
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
  const onSuccess = useInvalidateProducts()
  return useMutation({
    mutationFn: () => runWithAction('관리자 판매 중지', () => productApi.adminStopSale(productId)),
    onSuccess,
  })
}
