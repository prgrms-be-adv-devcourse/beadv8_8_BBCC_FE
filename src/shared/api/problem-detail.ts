import { isAxiosError } from 'axios'

/** 백엔드 오류 응답. 오류 코드 필드가 없으므로 status로만 분기한다 */
export type ProblemDetail = {
  type: string
  title: string
  status: number
  detail: string | null
  instance: string
}

export function isProblemDetail(value: unknown): value is ProblemDetail {
  return typeof value === 'object' && value !== null && 'status' in value && 'title' in value
}

export function getErrorStatus(error: unknown): number | null {
  return isAxiosError(error) ? (error.response?.status ?? null) : null
}

/** 화면에 보여 줄 오류 문구. ProblemDetail의 detail을 그대로 쓴다 */
export function getErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return '알 수 없는 오류가 발생했어요.'
  }
  const data: unknown = error.response?.data
  if (isProblemDetail(data)) {
    return data.detail ?? data.title
  }
  if (error.code === 'ECONNABORTED') {
    return '응답이 늦어 요청을 끝내지 못했어요. 다시 시도해 주세요.'
  }
  if (!error.response) {
    return '서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요.'
  }
  return `요청을 처리하지 못했어요. (${error.response.status})`
}
