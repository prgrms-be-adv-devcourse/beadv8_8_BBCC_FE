import { describe, expect, it } from 'vitest'
import { categoryIconOf } from '@/entities/product'

describe('categoryIconOf: 카테고리 이름으로 아이콘을 찾는다 (BE 카테고리에 아이콘 칸이 없다)', () => {
  it.each(['상의', '하의', '아우터', '원피스', '모자', '양말', ' 상의 '])(
    '기본 카테고리 %j는 아이콘이 있다',
    (name) => {
      expect(categoryIconOf(name)?.length).toBeGreaterThan(0)
    },
  )

  it.each(['신발', '', '상의 세트'])('아이콘이 없는 %j는 null (첫 글자로 보인다)', (name) => {
    expect(categoryIconOf(name)).toBeNull()
  })
})
