import { isRouteErrorResponse } from 'react-router'

export type RouteErrorView = {
  title: string
  /** 개발 · 시연 확인용 상세 (없으면 null) */
  detail: string | null
  /** 다시 시도(새로고침)가 의미 있는지 */
  reload: boolean
}

/** 라우터가 잡은 오류 → 화면에 보여 줄 문구 */
export function describeRouteError(error: unknown): RouteErrorView {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return { title: '화면을 찾을 수 없어요', detail: null, reload: false }
    }
    return {
      title: `문제가 생겼어요 (${error.status})`,
      detail: error.statusText || null,
      reload: true,
    }
  }
  if (error instanceof Error) {
    if (/dynamically imported module|Importing a module script failed/i.test(error.message)) {
      return { title: '화면을 불러오지 못했어요', detail: error.message, reload: true }
    }
    return { title: '화면을 그리다 문제가 생겼어요', detail: error.message, reload: true }
  }
  return { title: '문제가 생겼어요', detail: null, reload: true }
}
