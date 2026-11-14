import { describe, expect, it } from 'vitest'
import { ALL_CATEGORIES_ICON, categoryIconOf } from '@/entities/product'

describe('categoryIconOf: 카테고리 이름으로 아이콘을 찾는다 (BE 카테고리에 아이콘 칸이 없다)', () => {
  it.each(['상의', '하의', '바지', '치마', '아우터', '원피스', '모자', '양말', ' 상의 '])(
    '기본 카테고리 %j는 선과 얼룩 색이 있는 아이콘이 있다',
    (name) => {
      const icon = categoryIconOf(name)
      expect(icon?.strokes.length).toBeGreaterThan(0)
      expect(['sheet', 'marker']).toContain(icon?.blob)
    },
  )

  it.each(['신발', '', '상의 세트'])('아이콘이 없는 %j는 null (첫 글자로 보인다)', (name) => {
    expect(categoryIconOf(name)).toBeNull()
  })

  it('「전체」 아이콘도 선과 얼룩 색이 있다', () => {
    expect(ALL_CATEGORIES_ICON.strokes.length).toBeGreaterThan(0)
    expect(['sheet', 'marker']).toContain(ALL_CATEGORIES_ICON.blob)
  })
})
