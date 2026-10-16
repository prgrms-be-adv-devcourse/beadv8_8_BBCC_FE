import { describe, expect, it } from 'vitest'
import {
  productImageUploadUrlsShape,
  toUploadTargets,
  toUploadUrlsRequest,
  type ProductImageUploadUrlsDto,
} from '@/features/upload-product-image'
import { validate } from '@/shared/api'

const S3 = 'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com/dev/products/7'

const response: ProductImageUploadUrlsDto = {
  uploads: [
    {
      uploadUrl: `${S3}/a.jpg?X-Amz-Signature=1`,
      imageUrl: `${S3}/a.jpg`,
      expiresAt: '2026-10-16T03:05:00Z',
    },
    {
      uploadUrl: `${S3}/b.webp?X-Amz-Signature=2`,
      imageUrl: `${S3}/b.webp`,
      expiresAt: '2026-10-16T03:05:00Z',
    },
  ],
}

describe('toUploadUrlsRequest: 줄인 결과(Blob)의 형식 · 크기로 발급 요청', () => {
  it('파일 순서대로 Blob의 type과 size를 담는다', () => {
    const blobs = [
      new Blob(['a'.repeat(1234)], { type: 'image/jpeg' }),
      new Blob(['b'.repeat(56)], { type: 'image/webp' }),
    ]
    expect(toUploadUrlsRequest(blobs)).toEqual({
      files: [
        { contentType: 'image/jpeg', contentLength: 1234 },
        { contentType: 'image/webp', contentLength: 56 },
      ],
    })
  })
})

describe('toUploadTargets: 발급 응답 → 업로드할 곳', () => {
  it('요청 순서대로 업로드 주소 · 저장할 주소 · 만료 시각', () => {
    expect(toUploadTargets(response)).toEqual([
      {
        uploadUrl: `${S3}/a.jpg?X-Amz-Signature=1`,
        imageUrl: `${S3}/a.jpg`,
        expiresAt: '2026-10-16T03:05:00Z',
      },
      {
        uploadUrl: `${S3}/b.webp?X-Amz-Signature=2`,
        imageUrl: `${S3}/b.webp`,
        expiresAt: '2026-10-16T03:05:00Z',
      },
    ])
  })
})

describe('toUploadTargets: 만료 시각 (BE는 서울 시간을 시간대 없이 준다)', () => {
  const withExpiresAt = (expiresAt: string): ProductImageUploadUrlsDto => ({
    uploads: [{ uploadUrl: `${S3}/a.jpg?x`, imageUrl: `${S3}/a.jpg`, expiresAt }],
  })

  it.each([
    ['2026-10-16T12:05:00', '2026-10-16T12:05:00+09:00'],
    ['2026-10-16T12:05:00.123', '2026-10-16T12:05:00.123+09:00'],
    ['2026-10-16T03:05:00Z', '2026-10-16T03:05:00Z'],
    ['2026-10-16T12:05:00+09:00', '2026-10-16T12:05:00+09:00'],
  ])('%s는 %s로 읽는다 (시간대가 있으면 그대로)', (expiresAt, expected) => {
    expect(toUploadTargets(withExpiresAt(expiresAt))[0].expiresAt).toBe(expected)
  })
})

describe('발급 응답 모양 (계약 검사)', () => {
  it('BE 응답 모양과 같으면 문제가 없다', () => {
    expect(validate(response, productImageUploadUrlsShape)).toEqual([])
  })
  it('업로드 한 줄에 imageUrl이 없으면 missing', () => {
    const broken = { uploads: [{ uploadUrl: `${S3}/a.jpg?x`, expiresAt: '2026-10-16T03:05:00Z' }] }
    expect(validate(broken, productImageUploadUrlsShape)).toEqual([
      { path: 'uploads[0].imageUrl', type: 'missing', expected: 'string', actual: '없음' },
    ])
  })
})
