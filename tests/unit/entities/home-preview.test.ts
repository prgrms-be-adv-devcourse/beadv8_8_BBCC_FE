import { describe, expect, it } from 'vitest'
import { toHomePreview } from '@/entities/recommendation'

const card = {
  productId: '31',
  name: '기모 맨투맨',
  thumbnailUrl: null,
  businessName: '키들리상점',
  minPrice: 21000,
  recommendedSize: '120',
}

describe('toHomePreview: 홈 맛보기 4개 (BE HomePreviewResponse)', () => {
  it('출처 · 카드 · 이유를 옮기고, AI여도 이유가 없는 카드는 null로 둔다', () => {
    const preview = toHomePreview({
      source: 'AI',
      products: [
        { ...card, reason: '키 118cm에 맞는 사이즈가 있어요.' },
        { ...card, productId: '32', reason: null },
      ],
    })

    expect(preview.source).toBe('AI')
    expect(preview.products.map((product) => [product.id, product.reason])).toEqual([
      ['31', '키 118cm에 맞는 사이즈가 있어요.'],
      ['32', null],
    ])
  })
})
