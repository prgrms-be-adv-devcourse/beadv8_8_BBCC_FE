import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { endpointOf } from './mock-endpoints'
import { useMockSettings } from './mock-settings'

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

type MockMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type MockHandler = {
  method: MockMethod
  /** baseURL(/api/v1) 뒤 경로. :name은 경로 변수 */
  path: string
  handle: (request: MockRequest) => MockResult | Promise<MockResult>
}

/**
 * 실제 서버 응답을 목 저장소에 옮겨 적는다 (예: 실제로 등록한 상품을 목 목록에 이어 붙이기).
 * 2xx 응답만 받고, 그 도메인 목이 켜져 있을 때만 부른다. 응답을 바꾸지는 않는다
 */
export type MockObserver = {
  method: MockMethod
  path: string
  observe: (request: MockRequest, response: { status: number; data: unknown }) => void
}

type Route = { domain: string; method: string; pattern: RegExp; keys: string[] }

function toRoute(domain: string, method: string, path: string): Route {
  const keys: string[] = []
  const source = path.replace(/:([a-zA-Z]+)/g, (_, key: string) => {
    keys.push(key)
    return '([^/]+)'
  })
  return { domain, method, pattern: new RegExp(`^${source}$`), keys }
}

const observers: (Route & { observe: MockObserver['observe'] })[] = []

export function registerMockObservers(domain: string, list: MockObserver[]) {
  for (const observer of list) {
    observers.push({
      ...toRoute(domain, observer.method, observer.path),
      observe: observer.observe,
    })
  }
}

const handlers: {
  domain: string
  path: string
  method: string
  pattern: RegExp
  keys: string[]
  handle: MockHandler['handle']
}[] = []

/**
 * domain: 흐름 패널에서 켜고 끄는 단위 (예: 상품). 꺼진 도메인은 실제 서버로 보낸다.
 * mock-endpoints에서 'real'로 바꾼 엔드포인트는 등록하지 않는다 (늘 실제 서버)
 */
export function registerMockHandlers(domain: string, list: MockHandler[]) {
  useMockSettings.getState().register(domain)
  for (const handler of list) {
    if (endpointOf(handler.method, handler.path)?.source !== 'mock') continue
    handlers.push({
      ...toRoute(domain, handler.method, handler.path),
      path: handler.path,
      handle: handler.handle,
    })
  }
}

/** 이 엔드포인트가 지금 목으로 응답하는지 (등록됐고 도메인이 켜져 있음). 화면 배지용 */
export function isMockActive(
  method: string,
  path: string,
  enabled: Record<string, boolean> = useMockSettings.getState().enabled,
): boolean {
  return handlers.some(
    (handler) => handler.method === method && handler.path === path && enabled[handler.domain],
  )
}

const MOCK_DELAY_MS = 150

function queryOf(config: InternalAxiosRequestConfig, search: string): URLSearchParams {
  const query = new URLSearchParams(search)
  Object.entries((config.params ?? {}) as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value))
    }
  })
  return query
}

function parse(data: unknown): unknown {
  if (typeof data !== 'string' || data === '') return data ?? null
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

function notifyObservers(
  config: InternalAxiosRequestConfig,
  pathname: string,
  search: string,
  response: AxiosResponse,
) {
  const method = (config.method ?? 'get').toUpperCase()
  const enabled = useMockSettings.getState().enabled
  for (const observer of observers) {
    const match =
      enabled[observer.domain] && observer.method === method
        ? observer.pattern.exec(pathname)
        : null
    if (!match || response.status < 200 || response.status >= 300) continue
    try {
      observer.observe(
        {
          params: Object.fromEntries(observer.keys.map((key, index) => [key, match[index + 1]])),
          query: queryOf(config, search),
          body: parse(config.data),
          headers: config.headers,
        },
        { status: response.status, data: parse(response.data) },
      )
    } catch {
      // 목 저장소를 못 고쳐도 실제 응답은 그대로 넘긴다
    }
  }
}

export function createMockAdapter(realAdapter: AxiosAdapter): AxiosAdapter {
  return async (config) => {
    const [pathname, search = ''] = (config.url ?? '').split('?')
    const method = (config.method ?? 'get').toUpperCase()
    const enabled = useMockSettings.getState().enabled
    for (const handler of handlers) {
      if (config.skipMock || !enabled[handler.domain]) {
        continue
      }
      const match = handler.method === method ? handler.pattern.exec(pathname) : null
      if (!match) {
        continue
      }
      const query = queryOf(config, search)
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
    const response = await realAdapter(config)
    notifyObservers(config, pathname, search, response)
    return response
  }
}

export const defaultAdapter: AxiosAdapter = axios.getAdapter(axios.defaults.adapter)
