import { describe, expect, it } from 'vitest'
import { pickedColorNamesOf } from '@/entities/product'

// 홈 옵션 거르기: 색은 견본만 보이므로 고른 색 이름을 항목 이름 옆에 적는다
const COLOR = {
  code: 'COLOR',
  values: [
    { id: '101', name: '네이비', colorCode: '#1F2A44' },
    { id: '102', name: '그레이', colorCode: '#9CA3AF' },
    { id: '103', name: '무늬', colorCode: null },
  ],
}

describe('pickedColorNamesOf: 거르기에서 고른 색 이름', () => {
  it.each([
    [['COLOR:102'], ['그레이']],
    [
      ['COLOR:102', 'COLOR:101'],
      ['네이비', '그레이'],
    ],
    [[], []],
    // 다른 항목의 같은 ID는 세지 않는다
    [['SIZE:102'], []],
    // 색 값이 없는 값은 이름 칸으로 보이므로 적지 않는다
    [['COLOR:103'], []],
  ])('고른 값 %j → %j (항목의 값 순서대로)', (selected, expected) => {
    expect(pickedColorNamesOf(COLOR, new Set(selected))).toEqual(expected)
  })
})
