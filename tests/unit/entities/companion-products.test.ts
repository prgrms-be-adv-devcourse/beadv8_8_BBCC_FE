import { describe, expect, it } from 'vitest'
import { toCompanionProducts } from '@/entities/recommendation'

const card = {
  productId: '12',
  name: '데일리 조거 팬츠',
  thumbnailUrl: 'https://kidly.example/12.jpg',
  businessName: '키들리상점',
  minPrice: 19000,
  recommendedSize: '120',
}

describe('toCompanionProducts: 함께 사면 좋은 상품 (BE CompanionProductsResponse)', () => {
  it('출처와 상품 카드 · 이유를 화면 모델로 옮긴다', () => {
    const picks = toCompanionProducts({
      source: 'AI',
      products: [{ ...card, reason: '맨투맨과 같은 톤이라 함께 입기 좋아요.' }],
    })

    expect(picks).toEqual({
      source: 'AI',
      products: [
        {
          id: '12',
          name: '데일리 조거 팬츠',
          businessName: '키들리상점',
          minPrice: 19000,
          imageUrl: 'https://kidly.example/12.jpg',
          recommendedSize: '120',
          reason: '맨투맨과 같은 톤이라 함께 입기 좋아요.',
        },
      ],
    })
  })

  it.each([null, '', '   '])(
    '이유가 %j이면 null로 두어 이유 칸을 숨기게 한다 (기본 문구를 넣지 않는다)',
    (reason) => {
      const picks = toCompanionProducts({ source: 'AI', products: [{ ...card, reason }] })

      expect(picks.products[0]?.reason).toBeNull()
    },
  )

  it('후보가 없으면 빈 목록 그대로', () => {
    expect(toCompanionProducts({ source: 'RULE', products: [] })).toEqual({
      source: 'RULE',
      products: [],
    })
  })
})
