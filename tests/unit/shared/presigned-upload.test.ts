import { afterEach, describe, expect, it, vi } from 'vitest'
import { MOCK_UPLOAD_URL_PREFIX, putToPresignedUrl, UploadError } from '@/shared/api'

const UPLOAD_URL =
  'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com/dev/products/7/a.jpg?X-Amz-Signature=abc'
const blob = new Blob(['jpeg'], { type: 'image/jpeg' })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('putToPresignedUrl: 발급받은 주소로 S3에 바로 올린다', () => {
  it('본문은 Blob, Content-Type은 Blob 형식, 토큰 · 쿠키는 보내지 않는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await putToPresignedUrl(UPLOAD_URL, blob)

    expect(fetchMock).toHaveBeenCalledWith(UPLOAD_URL, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'image/jpeg' },
      credentials: 'omit',
    })
  })

  it.each([403, 400, 500])('S3가 %i로 거절하면 상태 코드를 담은 UploadError', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })))

    await expect(putToPresignedUrl(UPLOAD_URL, blob)).rejects.toEqual(new UploadError(status))
  })

  it('네트워크 · CORS로 실패하면 상태 코드 없는 UploadError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(putToPresignedUrl(UPLOAD_URL, blob)).rejects.toEqual(new UploadError(null))
  })

  it('목 업로드 주소면 네트워크로 보내지 않고 성공한다', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await putToPresignedUrl(`${MOCK_UPLOAD_URL_PREFIX}dev/products/7/a.jpg`, blob)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
