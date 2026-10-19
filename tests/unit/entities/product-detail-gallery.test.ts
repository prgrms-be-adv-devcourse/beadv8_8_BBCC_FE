import { describe, expect, it } from 'vitest'
import { detailImagesOf, galleryIndexOf } from '@/entities/product'

const T = 'https://cdn/t.jpg'
const A = 'https://cdn/a.jpg'
const B = 'https://cdn/b.jpg'

describe('detailImagesOf: 상품 설명 아래에 쌓을 상세 사진 (imageUrls 맨 앞은 대표)', () => {
  it.each([
    [
      [T, A, B],
      [A, B],
    ],
    [[T], []],
    [[], []],
  ])('사진 %j → 상세 %j', (imageUrls, expected) => {
    expect(detailImagesOf({ imageUrls })).toEqual(expected)
  })
})

describe('galleryIndexOf: 밀어 넘긴 위치 → 지금 보는 사진 번호', () => {
  it.each([
    [0, 300, 3, 0],
    [149, 300, 3, 0],
    [150, 300, 3, 1],
    [600, 300, 3, 2],
    [900, 300, 3, 2],
    [-20, 300, 3, 0],
    [100, 0, 3, 0],
  ])('scrollLeft %i · 너비 %i · %i장이면 %i번째', (scrollLeft, width, count, expected) => {
    expect(galleryIndexOf(scrollLeft, width, count)).toBe(expected)
  })
})
