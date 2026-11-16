import type { ProductViewRequestDto } from '../api/record-product-view.dto'

/** 조회의 종류: 상품 상세에 들어온 것 · 상품 칸의 담기 팝업을 연 것 (추천이 팝업을 더 낮은 무게로 센다) */
export type ProductViewKind = 'DETAIL' | 'QUICK'

export function toProductViewRequest(
  productId: string,
  childId: string | null,
  kind: ProductViewKind = 'DETAIL',
): ProductViewRequestDto {
  return {
    productId,
    ...(childId === null ? {} : { childId }),
    // 상세 진입은 칸을 넣지 않는다 (지금까지의 요청과 같다)
    ...(kind === 'QUICK' ? { viewType: 'QUICK' as const } : {}),
  }
}
