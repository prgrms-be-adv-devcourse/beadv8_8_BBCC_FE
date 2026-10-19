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
  brand: null,
  categoryId: '1',
  status: 'ON_SALE',
  minPrice: 25000,
  thumbnailUrl: S3,
}

describe('상품 · 추천 매퍼: thumbnailUrl → imageUrl', () => {
  it('상품 목록 · 상세 (상세는 imageUrls[0]이 대표)', () => {
    expect(toProductSummary(summary).imageUrl).toBe(S3)
    expect(toProductSummary({ ...summary, thumbnailUrl: null }).imageUrl).toBeNull()
    const detail = {
      productId: '1',
      name: '데일리 맨투맨',
      brand: null,
      businessName: null,
      categoryId: '1',
      description: null,
      status: 'ON_SALE',
      sizeFree: true,
      minPrice: null,
      optionAttributes: [],
      options: [],
      productInfo: [],
      sizeSpecs: [],
      measurementItems: [],
    }
    expect(toProductDetail({ ...detail, imageUrls: [S3, 'https://x/2.jpg'] }).imageUrl).toBe(S3)
    expect(toProductDetail({ ...detail, imageUrls: [] }).imageUrl).toBeNull()
  })

  it('자녀 맞춤 추천 목록', () => {
    const recommended = toRecommendedProduct({
      productId: '1',
      name: '데일리 맨투맨',
      thumbnailUrl: ' ',
      businessName: ' 테스트상점 ',
      minPrice: 25000,
      recommendedSize: null,
    })
    expect(recommended.imageUrl).toBeNull()
    expect(recommended.businessName).toBe('테스트상점')
    expect(recommended.recommendedSize).toBeNull()
  })
})
