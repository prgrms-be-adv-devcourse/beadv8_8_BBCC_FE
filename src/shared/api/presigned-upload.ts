import { useApiFlowLog } from './api-flow-log'

/** S3 업로드 실패. status가 null이면 네트워크 · CORS로 응답을 받지 못한 것 */
export class UploadError extends Error {
  readonly status: number | null

  constructor(status: number | null) {
    super(status === null ? '업로드 서버에 연결하지 못했어요.' : `업로드하지 못했어요. (${status})`)
    this.name = 'UploadError'
    this.status = status
  }
}

/**
 * 흐름 패널에 남긴다. 주소의 쿼리(서명 값)는 가진 사람 누구나 올릴 수 있는 값이라 지우고 경로만 둔다.
 * 토큰을 보내지 않으므로 호출한 회원은 없다
 */
function record(uploadUrl: string, blob: Blob, startedAt: number, status: number | null) {
  const log = useApiFlowLog.getState()
  log.add({
    action: log.currentAction,
    actor: null,
    method: 'PUT',
    path: uploadUrl.split('?')[0],
    status,
    expectedReason: null,
    durationMs: Math.round(performance.now() - startedAt),
    startedAt: new Date(performance.timeOrigin + startedAt).toISOString(),
    mock: false,
    requestBody: { contentType: blob.type, contentLength: blob.size },
    responseBody: null,
  })
}

async function send(uploadUrl: string, blob: Blob): Promise<number | null> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': blob.type },
      credentials: 'omit',
    })
    return response.status
  } catch {
    return null
  }
}

/**
 * 서명된 업로드 주소(S3 Presigned PUT)로 파일을 올린다.
 * 공통 클라이언트(apiClient)를 쓰지 않는다: Authorization 헤더나 쿠키가 붙으면 서명이 깨지고 토큰이 S3로 간다.
 * Content-Type은 발급 때 보낸 형식과 글자까지 같아야 하므로 Blob의 type을 그대로 쓴다
 */
export async function putToPresignedUrl(uploadUrl: string, blob: Blob): Promise<void> {
  const startedAt = performance.now()
  const status = await send(uploadUrl, blob)
  record(uploadUrl, blob, startedAt, status)
  if (status === null || status < 200 || status >= 300) throw new UploadError(status)
}
