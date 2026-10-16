import { AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { productHandlers } from '@/app/mocks/product-handlers'
import type { MockResult } from '@/shared/api'

// 목 응답은 BE 확정 계약(SellerProductImageController)과 같은 상태 코드 · 문구를 낸다

const handler = productHandlers.find(
  (item) => item.method === 'POST' && item.path === '/seller/product-images/upload-urls',
)

const tokenOf = (claims: object) => `Bearer h.${btoa(JSON.stringify(claims)).replace(/=+$/, '')}.s`

const SELLER = tokenOf({ sub: '7', roles: ['BUYER', 'SELLER'] })
const BUYER = tokenOf({ sub: '8', roles: ['BUYER'] })
const MB = 1024 * 1024
const jpeg = (contentLength = 1000) => ({ contentType: 'image/jpeg', contentLength })

async function issue(body: unknown, authorization?: string): Promise<MockResult> {
  if (!handler) throw new Error('업로드 주소 발급 목이 없다')
  const headers = new AxiosHeaders(authorization ? { Authorization: authorization } : {})
  return handler.handle({ params: {}, query: new URLSearchParams(), body, headers })
}

const problemOf = (result: MockResult) => result.data as { title: string; detail: string }

describe('업로드 주소 발급 목: 권한', () => {
  it('토큰이 없으면 401', async () => {
    expect((await issue({ files: [jpeg()] })).status).toBe(401)
  })
  it('판매자 역할이 없으면 403', async () => {
    expect((await issue({ files: [jpeg()] }, BUYER)).status).toBe(403)
  })
})

describe('업로드 주소 발급 목: 400 (title "잘못된 요청입니다", detail은 "필드: 메시지")', () => {
  it.each([
    ['목록 없음', {}, 'files: 이미지 목록을 넣어 주세요.'],
    ['0장', { files: [] }, 'files: 이미지는 한 번에 1장 이상 10장 이하로 요청해 주세요.'],
    [
      '11장',
      { files: Array.from({ length: 11 }, () => jpeg()) },
      'files: 이미지는 한 번에 1장 이상 10장 이하로 요청해 주세요.',
    ],
    [
      '두 번째가 SVG',
      { files: [jpeg(), { contentType: 'image/svg+xml', contentLength: 1000 }] },
      'files[1].contentType: jpeg, png, webp 이미지만 올릴 수 있습니다.',
    ],
    [
      '대문자 형식',
      { files: [{ contentType: 'IMAGE/JPEG', contentLength: 1000 }] },
      'files[0].contentType: jpeg, png, webp 이미지만 올릴 수 있습니다.',
    ],
    [
      '0바이트',
      { files: [jpeg(0)] },
      'files[0].contentLength: 이미지는 한 장에 1바이트 이상 10MB 이하로 올려 주세요.',
    ],
    [
      '두 번째가 10MB + 1',
      { files: [jpeg(), jpeg(10 * MB + 1)] },
      'files[1].contentLength: 이미지는 한 장에 1바이트 이상 10MB 이하로 올려 주세요.',
    ],
  ])('%s → %s', async (_label, body, detail) => {
    const result = await issue(body, SELLER)
    expect(result.status).toBe(400)
    expect(problemOf(result)).toMatchObject({ title: '잘못된 요청입니다', detail })
  })
})

describe('업로드 주소 발급 목: 200', () => {
  it('요청 순서대로 저장 주소 · 서울 시간(시간대 없음) 만료 시각을 준다', async () => {
    const result = await issue({ files: [jpeg(), jpeg(10 * MB)] }, SELLER)
    const { uploads } = result.data as { uploads: { imageUrl: string; expiresAt: string }[] }
    expect(result.status).toBe(200)
    expect(uploads).toHaveLength(2)
    for (const upload of uploads) {
      expect(upload.imageUrl).toMatch(
        /^https:\/\/team04-kidly-s3\.s3\.ap-northeast-2\.amazonaws\.com\/dev\/products\/7\/[\w-]+\.jpg$/,
      )
      expect(upload.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    }
  })
})
