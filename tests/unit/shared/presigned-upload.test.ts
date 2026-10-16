import { afterEach, describe, expect, it, vi } from 'vitest'
import { putToPresignedUrl, runWithAction, UploadError, useApiFlowLog } from '@/shared/api'

const UPLOAD_URL =
  'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com/dev/products/7/a.jpg?X-Amz-Signature=abc'
const blob = new Blob(['jpeg'], { type: 'image/jpeg' })

afterEach(() => {
  vi.unstubAllGlobals()
  useApiFlowLog.getState().clear()
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
})

describe('putToPresignedUrl: 흐름 패널 기록', () => {
  it('서명 값(쿼리)을 지운 주소 · 상태 · 행동 이름 · 보낸 형식과 크기를 남긴다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })))

    await runWithAction('이미지 업로드', () => putToPresignedUrl(UPLOAD_URL, blob))

    expect(useApiFlowLog.getState().logs).toMatchObject([
      {
        action: '이미지 업로드',
        actor: null,
        method: 'PUT',
        path: 'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com/dev/products/7/a.jpg',
        status: 200,
        mock: false,
        requestBody: { contentType: 'image/jpeg', contentLength: 4 },
        responseBody: null,
      },
    ])
  })

  it.each([
    [403, () => vi.fn().mockResolvedValue(new Response(null, { status: 403 }))],
    [null, () => vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))],
  ])('실패해도 기록한다 (상태 %s)', async (status, fetchOf) => {
    vi.stubGlobal('fetch', fetchOf())

    await expect(putToPresignedUrl(UPLOAD_URL, blob)).rejects.toBeInstanceOf(UploadError)

    expect(useApiFlowLog.getState().logs).toMatchObject([{ method: 'PUT', status }])
  })
})
