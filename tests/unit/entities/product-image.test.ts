import { describe, expect, it } from 'vitest'
import { toProductDetail, toProductSummary, type ProductSummaryDto } from '@/entities/product'
import { toRecommendedProduct } from '@/entities/recommendation'
import { toImageUrl } from '@/shared/lib'

const S3 = 'https://kidly-bucket.s3.ap-northeast-2.amazonaws.com/products/1/thumb.jpg'

describe('toImageUrl: 응답의 이미지 주소를 화면에서 쓸 값으로', () => {
  it('주소가 있으면 그대로 (앞뒤 공백만 뗌)', () => {
    expect(toImageUrl(S3)).toBe(S3)
    expect(toImageUrl(`  ${S3} `)).toBe(S3)
  })

  it('없거나 빈 값이면 null → 기본 이미지', () => {
    expect(toImageUrl(null)).toBeNull()
    expect(toImageUrl(undefined)).toBeNull()
    expect(toImageUrl('')).toBeNull()
    expect(toImageUrl('   ')).toBeNull()
  })
})

const summary: ProductSummaryDto = {
  productId: '1',
  name: '데일리 맨투맨',
  categoryId: '1',
  categoryName: '상의',
  sellerId: '2',
  sellerName: '테스트상점',
  status: 'ON_SALE',
  minPrice: 25000,
  thumbnailUrl: S3,
}

describe('상품 · 추천 매퍼: thumbnailUrl → imageUrl', () => {
  it('상품 목록 · 상세', () => {
    expect(toProductSummary(summary).imageUrl).toBe(S3)
    expect(toProductSummary({ ...summary, thumbnailUrl: null }).imageUrl).toBeNull()
    expect(toProductDetail({ ...summary, description: '', options: [] }).imageUrl).toBe(S3)
  })

  it('자녀 맞춤 추천 목록', () => {
    const recommended = toRecommendedProduct({
      productId: '1',
      name: '데일리 맨투맨',
      categoryName: '상의',
      sellerName: '테스트상점',
      minPrice: 25000,
      thumbnailUrl: ' ',
      recommendedSize: '120',
      fit: 'GOOD',
    })
    expect(recommended.imageUrl).toBeNull()
  })
})
