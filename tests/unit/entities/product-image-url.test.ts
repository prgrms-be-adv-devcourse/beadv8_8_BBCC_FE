import { describe, expect, it } from 'vitest'
import { productImageUrlOf } from '@/entities/product'

// 조르기 · 장바구니 줄의 상품 사진: 상품 상세의 대표 사진, 없으면 상세 사진 첫 장, 둘 다 없으면 null
describe('상품 대표 사진 주소', () => {
  it('대표 → 상세 첫 장 → null', () => {
    expect(productImageUrlOf({ thumbnailUrl: 'a.jpg', imageUrls: ['b.jpg'] })).toBe('a.jpg')
    expect(productImageUrlOf({ thumbnailUrl: null, imageUrls: ['b.jpg'] })).toBe('b.jpg')
    expect(productImageUrlOf({ thumbnailUrl: '  ', imageUrls: [] })).toBeNull()
  })
})
