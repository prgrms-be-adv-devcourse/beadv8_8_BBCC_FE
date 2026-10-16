/** 목 핸들러가 주는 업로드 주소의 머리말. 이 주소는 네트워크로 보내지 않고 성공으로 끝낸다 */
export const MOCK_UPLOAD_URL_PREFIX = 'mock-upload://'

const MOCK_UPLOAD_DELAY_MS = 150

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
 * 서명된 업로드 주소(S3 Presigned PUT)로 파일을 올린다.
 * 공통 클라이언트(apiClient)를 쓰지 않는다: Authorization 헤더나 쿠키가 붙으면 서명이 깨지고 토큰이 S3로 간다.
 * Content-Type은 발급 때 보낸 형식과 글자까지 같아야 하므로 Blob의 type을 그대로 쓴다
 */
export async function putToPresignedUrl(uploadUrl: string, blob: Blob): Promise<void> {
  if (uploadUrl.startsWith(MOCK_UPLOAD_URL_PREFIX)) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_UPLOAD_DELAY_MS))
    return
  }
  let response: Response
  try {
    response = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': blob.type },
      credentials: 'omit',
    })
  } catch {
    throw new UploadError(null)
  }
  if (!response.ok) throw new UploadError(response.status)
}
