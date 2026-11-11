import { describe, expect, it } from 'vitest'
import { toProductDetail, type ProductDetailDto } from '@/entities/product'

// 구매자 상품 상세: 사이즈 항목은 서버의 optionAttributes[].sizeRole로, 대표 이미지는 thumbnailUrl로 정한다
// (BE #1252 · #1253). thumbnailUrl이 null이면 imageUrls의 첫 번째를 쓴다

const S3 = 'https://kidly.s3.ap-northeast-2.amazonaws.com/products/1.jpg'
const base: ProductDetailDto = {
  productId: '7',
  name: '데일리 맨투맨',
  brand: null,
  businessName: null,
  categoryId: '11',
  description: null,
  status: 'ON_SALE',
  sizeFree: false,
  minPrice: 25000,
  thumbnailUrl: null,
  imageUrls: [],
  optionAttributes: [
    {
      attributeId: '1',
      code: 'COLOR',
      name: '색상',
      sizeRole: false,
      values: [{ valueId: '101', value: '110', colorCode: null }],
    },
    {
      attributeId: '2',
      code: 'AGE',
      name: '나이',
      sizeRole: true,
      values: [{ valueId: '202', value: '5세', colorCode: null }],
    },
  ],
  options: [
    {
      optionId: '1001',
      optionName: '110 / 5세',
      valueIds: ['101', '202'],
      price: 25000,
      purchasable: true,
      stockStatus: 'AVAILABLE',
      stockQuantity: null,
    },
  ],
  productInfo: [],
  sizeSpecs: [{ size: '110', minHeightCm: 105, maxHeightCm: 115, measurements: {} }],
  measurementItems: [],
}

describe('사이즈 항목은 서버의 sizeRole로', () => {
  it('sizeRole=true인 항목만 사이즈다 (값 이름이 실측 사이즈와 같아도 sizeRole=false면 아니다)', () => {
    const detail = toProductDetail(base)
    expect(detail.optionAttributes.map((attribute) => [attribute.name, attribute.isSize])).toEqual([
      ['색상', false],
      ['나이', true],
    ])
    expect(detail.options[0].size).toBe('5세')
  })

  it('sizeRole=true인 항목이 없으면 사이즈가 없다', () => {
    const noSize = {
      ...base,
      optionAttributes: base.optionAttributes.map((attribute) => ({
        ...attribute,
        sizeRole: false,
      })),
    }
    const detail = toProductDetail(noSize)
    expect(detail.optionAttributes.every((attribute) => !attribute.isSize)).toBe(true)
    expect(detail.options[0].size).toBeNull()
  })
})

describe('대표 이미지는 thumbnailUrl로', () => {
  it.each([
    [S3, ['https://x/detail-1.jpg'], S3],
    [null, [S3, 'https://x/detail-1.jpg'], S3],
    [null, [], null],
  ])('thumbnailUrl %s · imageUrls %j → %s', (thumbnailUrl, imageUrls, expected) => {
    const detail = toProductDetail({ ...base, thumbnailUrl, imageUrls })
    expect(detail.imageUrl).toBe(expected)
    expect(detail.imageUrls).toEqual(imageUrls)
  })
})
