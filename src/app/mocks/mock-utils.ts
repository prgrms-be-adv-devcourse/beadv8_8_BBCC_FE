import axios from 'axios'
import type { MockRequest } from '@/shared/api'
import { env } from '@/shared/config'

/** 목 핸들러가 실제 서버 데이터(예: 자녀 키)를 읽을 때 쓰는 클라이언트. 흐름 패널에는 기록하지 않는다 */
const realServer = axios.create({ baseURL: `${env.apiBaseUrl}/api/v1`, withCredentials: true })

export function fetchReal<T>(request: MockRequest, path: string): Promise<T> {
  return realServer
    .get<T>(path, { headers: { Authorization: request.headers.Authorization } })
    .then((response) => response.data)
}

/** Authorization 토큰의 sub(회원 ID). 없으면 null */
export function memberIdOf(request: MockRequest): string | null {
  const header = String(request.headers.Authorization ?? '')
  const payload = header.replace('Bearer ', '').split('.')[1]
  if (!payload) {
    return null
  }
  try {
    return (JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { sub: string }).sub
  } catch {
    return null
  }
}

export function page<T>(content: T[], request: MockRequest) {
  const pageNumber = Number(request.query.get('page') ?? 0)
  const size = Number(request.query.get('size') ?? 20)
  const slice = content.slice(pageNumber * size, (pageNumber + 1) * size)
  return {
    content: slice,
    page: pageNumber,
    size,
    totalElements: content.length,
    totalPages: Math.max(1, Math.ceil(content.length / size)),
    hasNext: (pageNumber + 1) * size < content.length,
  }
}

export function problem(status: number, title: string, detail: string, instance: string) {
  return { status, data: { type: 'about:blank', title, status, detail, instance } }
}

export function now(): string {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const STORAGE_PREFIX = 'kidly.mock.'

/** 목 데이터는 탭(sessionStorage)에 저장해 새로고침해도 시연 상태가 유지되게 한다 */
export function loadMockState<T>(key: string, fallback: T): T {
  try {
    const saved = sessionStorage.getItem(STORAGE_PREFIX + key)
    return saved ? (JSON.parse(saved) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveMockState(key: string, value: unknown) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    // 저장할 수 없으면 메모리에만 둔다
  }
}
