import { describe, expect, it } from 'vitest'
import {
  canUploadImageSize,
  canUploadImageType,
  isUploadUrlExpired,
  validateImageCount,
} from '@/features/upload-product-image'

const MB = 1024 * 1024

describe('상품 이미지 업로드 규칙 (BE ProductImageUpload)', () => {
  it.each([
    ['image/jpeg', true],
    ['image/png', true],
    ['image/webp', true],
    ['image/svg+xml', false],
    ['image/gif', false],
    ['image/heic', false],
    ['IMAGE/JPEG', false],
    ['', false],
  ])('형식 %s는 올릴 수 있는지 %s다', (type, expected) => {
    expect(canUploadImageType(type)).toBe(expected)
  })

  it.each([
    [1, true],
    [10 * MB, true],
    [10 * MB + 1, false],
    [0, false],
  ])('크기 %i바이트는 올릴 수 있는지 %s다', (size, expected) => {
    expect(canUploadImageSize(size)).toBe(expected)
  })

  it.each([
    [0, 1],
    [0, 10],
    [9, 1],
    [3, 7],
  ])('이미 %i장 있을 때 %i장을 더하면 10장 이하라 통과', (current, adding) => {
    expect(validateImageCount(current, adding)).toBeNull()
  })

  it.each([
    [0, 11],
    [10, 1],
    [5, 6],
  ])('이미 %i장 있을 때 %i장을 더하면 10장을 넘어 거절', (current, adding) => {
    expect(validateImageCount(current, adding)).toBe('사진은 10장까지 올릴 수 있어요.')
  })

  it.each([
    ['2026-10-16T03:04:59.999Z', false],
    ['2026-10-16T03:05:00.000Z', true],
    ['2026-10-16T03:05:00.001Z', true],
  ])('만료 시각이 2026-10-16T03:05:00Z인 주소는 %s에 만료됐는지 %s다', (now, expected) => {
    expect(isUploadUrlExpired('2026-10-16T03:05:00Z', new Date(now))).toBe(expected)
  })
})
