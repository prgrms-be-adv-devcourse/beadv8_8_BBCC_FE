import type { UpdateProductRequestDto } from '@/entities/product'
import type { MockHandler } from '@/shared/api'
import { problem } from './mock-utils'

// 상품은 상품 수정(PATCH)만 BE에 없어 목으로 응답한다.
// 목록 · 상세는 실제 API라 목 수정은 화면에 반영되지 않는다 (요청이 오류 없이 끝나는 것까지만)
export const productHandlers: MockHandler[] = [
  {
    method: 'PATCH',
    path: '/seller/products/:productId',
    handle: (request) => {
      const body = request.body as UpdateProductRequestDto
      if (!body.name?.trim()) {
        return problem(
          400,
          '잘못된 요청입니다',
          '상품명을 입력해 주세요.',
          `/api/v1/seller/products/${request.params.productId}`,
        )
      }
      return { status: 200 }
    },
  },
]
