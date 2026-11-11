import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/shared/config'
import { useApiFlowLog } from './api-flow-log'
import { expectedReasonOf, type ExpectedResponse } from './call-outcome'
import { createMockAdapter, defaultAdapter } from './mock-adapter'
import { isSessionRejected } from './problem-detail'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** true면 Authorization을 붙이지 않는다 (로그인 · 재발급 · 로그아웃) */
    skipAuth?: boolean
    /** 401 뒤 재시도한 요청이면 true. 두 번 재시도하지 않는다 */
    retried?: boolean
    startedAt?: number
    /** 흐름 기록 ID (계약 검사 결과를 붙일 때 쓴다) */
    logId?: number
    /** 정상 흐름에서도 오는 오류 응답. 흐름 패널에 "예상됨"으로 표시하고 실패로 세지 않는다 */
    expected?: ExpectedResponse
    /** true면 목 핸들러를 건너뛰고 실제 서버로 보낸다 (연결 점검) */
    skipMock?: boolean
    /** 붙일 토큰의 주체. 회원 · 자녀가 같이 쓰는 경로(/cart · /wish/requests)에서 자녀 화면이 'child'로 정한다 */
    principal?: Principal
  }
}

/** 공통 클라이언트가 세션을 직접 알지 않도록 app에서 연결한다 (configureAuth) */
type AuthHandlers = {
  getAccessToken: () => string | null
  onTokenReissued: (accessToken: string) => void
  onAuthFailed: () => void
}

/** 로그인 주체. 회원과 관리자는 토큰 · 재발급 쿠키가 따로다 (BE #736) */
export type Principal = 'member' | 'admin' | 'child'

/**
 * 관리자 API(/admin/…)는 관리자 토큰만 받는다 (BE #755: 회원 토큰은 403).
 * 경로만으로 주체를 알 수 없는 API(장바구니 · 조르기는 회원과 자녀가 같이 쓴다, BE #998 · #999)는 요청이 정한 주체를 따른다
 */
export function principalOf(url: string | undefined, requested?: Principal): Principal {
  if (requested) return requested
  if (url?.startsWith('/child/') || url?.startsWith('/auth/child/')) return 'child'
  return url?.startsWith('/admin/') ? 'admin' : 'member'
}

const REISSUE_PATH: Record<Principal, string> = {
  member: '/auth/reissue',
  admin: '/auth/admin/reissue',
  child: '/auth/child/reissue',
}

const noAuth: AuthHandlers = {
  getAccessToken: () => null,
  onTokenReissued: () => {},
  onAuthFailed: () => {},
}

const authHandlers: Record<Principal, AuthHandlers> = {
  member: noAuth,
  admin: noAuth,
  child: noAuth,
}

export function configureAuth(principal: Principal, handlers: AuthHandlers) {
  authHandlers[principal] = handlers
}

export const apiClient = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  timeout: 10_000,
  // Refresh Token이 HttpOnly 쿠키라 로그인 · 재발급 · 로그아웃에 쿠키가 실려야 한다
  withCredentials: true,
  adapter: createMockAdapter(defaultAdapter),
})

const reissuing: Record<Principal, Promise<string> | null> = {
  member: null,
  admin: null,
  child: null,
}

/** 동시에 여러 요청이 401을 받아도 재발급은 주체마다 한 번만 보낸다 (Refresh Token이 매번 교체되므로) */
/**
 * 새로고침 뒤 로그인 되살리기용 재발급. 서버가 잠깐 멈춘 것(배포 중 503 · 연결 실패)이면 몇 번 기다렸다 다시 시도한다.
 * 토큰 거절(401 · 403)은 바로 실패한다
 */
export async function reissueForRestore(
  principal: Principal = 'member',
  { tries = 4, delayMs = 2000 }: { tries?: number; delayMs?: number } = {},
): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await reissueAccessToken(principal)
    } catch (error) {
      if (isSessionRejected(error) || attempt >= tries) throw error
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
    }
  }
}

export function reissueAccessToken(principal: Principal = 'member'): Promise<string> {
  reissuing[principal] ??= apiClient
    .post<{ accessToken: string }>(REISSUE_PATH[principal], undefined, {
      skipAuth: true,
      retried: true,
      expected: { statuses: [401], reason: '재발급 쿠키 없음 (로그인 전 · 역할 전환)' },
    })
    .then((response) => {
      authHandlers[principal].onTokenReissued(response.data.accessToken)
      return response.data.accessToken
    })
    .finally(() => {
      reissuing[principal] = null
    })
  return reissuing[principal]
}

apiClient.interceptors.request.use((config) => {
  config.startedAt = performance.now()
  const accessToken = authHandlers[principalOf(config.url, config.principal)].getAccessToken()
  if (!config.skipAuth && accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

function record(config: InternalAxiosRequestConfig, response: AxiosResponse | undefined) {
  const startedAt = config.startedAt ?? performance.now()
  const log = useApiFlowLog.getState()
  config.logId = log.add({
    action: log.currentAction,
    actor: actorOf(config),
    method: (config.method ?? 'get').toUpperCase(),
    path: config.url ?? '',
    status: response?.status ?? null,
    expectedReason: expectedReasonOf(response?.status ?? null, config.expected),
    durationMs: Math.round(performance.now() - startedAt),
    startedAt: new Date(performance.timeOrigin + startedAt).toISOString(),
    mock: response?.headers['x-mock'] === 'true',
    requestBody: parseBody(config.data),
    // 스트림은 아직 읽기 전이라 비워 두고, 다 읽은 뒤 getEventStream이 채운다
    responseBody: config.responseType === 'stream' ? null : (response?.data ?? null),
  })
}

/** 토큰 sub(회원 ID, 관리자는 "admin:7")만 읽는다. 서명 검증은 서버가 한다 */
function actorOf(config: InternalAxiosRequestConfig): string | null {
  const payload = String(config.headers.Authorization ?? '')
    .replace('Bearer ', '')
    .split('.')[1]
  if (!payload) {
    return null
  }
  try {
    return (
      (JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: string }).sub ??
      null
    )
  } catch {
    return null
  }
}

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data ?? null
  }
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

apiClient.interceptors.response.use(
  (response) => {
    record(response.config, response)
    return response
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      throw error
    }
    const config = error.config
    record(config, error.response)

    // 403은 권한 · 이용 제한이라 재발급하지 않는다
    if (error.response?.status !== 401 || config.retried || config.skipAuth) {
      throw error
    }
    config.retried = true
    const principal = principalOf(config.url, config.principal)
    try {
      const accessToken = await reissueAccessToken(principal)
      config.headers.Authorization = `Bearer ${accessToken}`
    } catch (reissueError) {
      // 서버가 잠깐 멈춘 것(배포 중 503 · 연결 실패)이면 로그인을 지우지 않고 원래 오류를 그대로 낸다
      if (!isSessionRejected(reissueError)) throw error
      // 재발급 거절: 로그인 상태를 정리하고 토큰 없이 한 번 더 보낸다 (공개 API는 이것으로 성공)
      authHandlers[principal].onAuthFailed()
      config.headers.delete('Authorization')
      config.skipAuth = true
    }
    return apiClient(config)
  },
)
