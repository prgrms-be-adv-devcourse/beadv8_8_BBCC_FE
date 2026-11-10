import { apiClient } from '@/shared/api'
import type { ProductViewRequestDto } from './record-product-view.dto'

/** 204 (본문 없음). 로그인 회원만 부른다 */
export function recordProductView(body: ProductViewRequestDto) {
  return apiClient.post<void>('/recommendations/product-views', body)
}
