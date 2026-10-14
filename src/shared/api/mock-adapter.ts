import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

/**
 * 백엔드에 아직 없는 API(상품 · 추천 · 정산)에 목 응답을 준다.
 * 등록한 경로만 가로채고 나머지는 실제 서버로 보낸다. 목 응답에는 x-mock: true 헤더를 붙여 흐름 패널에 "목"으로 표시한다.
 * (msw 승인 전까지 패키지 추가 없이 쓰는 방식)
 */
export type MockRequest = {
  params: Record<string, string>
  query: URLSearchParams
  body: unknown
  headers: InternalAxiosRequestConfig['headers']
}

export type MockResult = { status: number; data?: unknown }

export type MockHandler = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  /** baseURL(/api/v1) 뒤 경로. :name은 경로 변수 */
  path: string
  handle: (request: MockRequest) => MockResult | Promise<MockResult>
}

const handlers: {
  method: string
  pattern: RegExp
  keys: string[]
  handle: MockHandler['handle']
}[] = []

export function registerMockHandlers(list: MockHandler[]) {
  for (const handler of list) {
    const keys: string[] = []
    const source = handler.path.replace(/:([a-zA-Z]+)/g, (_, key: string) => {
      keys.push(key)
      return '([^/]+)'
    })
    handlers.push({
      method: handler.method,
      pattern: new RegExp(`^${source}$`),
      keys,
      handle: handler.handle,
    })
  }
}

const MOCK_DELAY_MS = 150

export function createMockAdapter(realAdapter: AxiosAdapter): AxiosAdapter {
  return async (config) => {
    const [pathname, search = ''] = (config.url ?? '').split('?')
    const method = (config.method ?? 'get').toUpperCase()
    for (const handler of handlers) {
      const match = handler.method === method ? handler.pattern.exec(pathname) : null
      if (!match) {
        continue
      }
      const query = new URLSearchParams(search)
      Object.entries((config.params ?? {}) as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.set(key, String(value))
        }
      })
      const params = Object.fromEntries(handler.keys.map((key, index) => [key, match[index + 1]]))
      const result = await handler.handle({
        params,
        query,
        body: typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? null),
        headers: config.headers,
      })
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
      const response: AxiosResponse = {
        // 실제 네트워크처럼 복사본을 준다 (목 저장소 객체를 그대로 넘기면 캐시가 바뀐 줄 모른다)
        data: result.data === undefined ? '' : JSON.parse(JSON.stringify(result.data)),
        status: result.status,
        statusText: String(result.status),
        headers: new AxiosHeaders({ 'x-mock': 'true' }),
        config,
        request: null,
      }
      if (config.validateStatus && !config.validateStatus(result.status)) {
        throw new AxiosError(
          `목 응답 ${result.status}`,
          result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
          config,
          null,
          response,
        )
      }
      return response
    }
    return realAdapter(config)
  }
}

export const defaultAdapter: AxiosAdapter = axios.getAdapter(axios.defaults.adapter)
