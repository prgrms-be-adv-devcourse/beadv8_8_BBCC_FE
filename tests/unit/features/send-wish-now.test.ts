import { describe, expect, it } from 'vitest'
import { wishNowCartOnlyNotice, wishNowMergeNotice } from '@/features/send-wish-now'

// 자녀 「바로 조르기」: 장바구니에 담고(①) 그 칸으로 조르기를 보낸다(②)
describe('바로 조르기 안내 문구', () => {
  it('같은 옵션이 장바구니에 있으면 합친 수량으로 조른다고 알린다', () => {
    expect(wishNowMergeNotice(2, 1)).toBe(
      '장바구니에 같은 상품이 2개 있어요. 합쳐서 3개로 조를게요.',
    )
    expect(wishNowMergeNotice(null, 1)).toBeNull()
  })

  it('①은 됐는데 ②가 실패하면 장바구니에 담겼다고 알리고 이유를 붙인다', () => {
    expect(wishNowCartOnlyNotice('진행 중인 조르기에 든 상품이에요.')).toBe(
      '장바구니에는 담았어요. 조르기는 보내지 못했어요: 진행 중인 조르기에 든 상품이에요. 장바구니에서 다시 조를 수 있어요.',
    )
  })
})
