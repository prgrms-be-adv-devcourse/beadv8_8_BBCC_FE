import axios, { type AxiosResponse } from 'axios'
import { useApiFlowLog } from './api-flow-log'
import { apiClient } from './client'
import { validate, type Shape } from './contract'
import { readSseEvents, type SseEvent } from './sse'

/** 스트림은 XHR로 읽을 수 없어 fetch 어댑터를 쓴다 */
const streamAdapter = axios.getAdapter('fetch')

export type StreamEvent<T> = { event: string; data: T }

type GetEventStreamOptions = {
  params?: Record<string, string>
  /** 페이지를 떠나면 끊는다 */
  signal?: AbortSignal
  /** 이벤트마다 data를 검사할 계약 모양 */
  shape: Shape
}

/** 서버가 스트림 대신 JSON으로 답하면(Accept를 무시한 서버 · 테스트 응답) 그 응답을 이벤트 하나('message')로 본다 */
async function eventsOf(response: AxiosResponse<ReadableStream<Uint8Array>>): Promise<SseEvent[]> {
  const contentType = String(response.headers['content-type'] ?? '')
  if (!contentType.includes('application/json')) return readSseEvents(response.data)
  const text = await new Response(response.data).text()
  return [{ event: 'message', data: text }]
}

/** 스트림 요청의 오류 본문(ProblemDetail)도 스트림으로 온다. JSON으로 읽어 두어 화면이 detail · 상태 코드를 쓰게 한다 */
async function withReadBody(error: unknown): Promise<never> {
  const response = axios.isAxiosError(error) ? error.response : undefined
  if (response?.data instanceof ReadableStream) {
    const text = await new Response(response.data).text()
    try {
      response.data = text ? JSON.parse(text) : null
    } catch {
      response.data = text
    }
    const logId = response.config.logId
    if (logId !== undefined)
      useApiFlowLog.getState().completeLog(logId, { responseBody: response.data })
  }
  throw error
}

/**
 * text/event-stream을 공통 클라이언트로 받아 닫힐 때까지 모은다 (토큰 · 401 재발급 · 흐름 기록을 그대로 쓴다).
 * 이벤트 data는 JSON으로 읽어 계약 모양을 검사하고, 흐름 기록에 받은 이벤트 순서 · 마지막 data · 걸린 시간을 남긴다.
 * 스트림을 열기 전 오류(400 · 401 · 403 · 404)는 지금처럼 axios 오류로 던진다
 */
export async function getEventStream<T>(
  path: string,
  { params, signal, shape }: GetEventStreamOptions,
): Promise<StreamEvent<T>[]> {
  const startedAt = performance.now()
  const response = await apiClient
    .get<ReadableStream<Uint8Array>>(path, {
      params,
      signal,
      adapter: streamAdapter,
      responseType: 'stream',
      // AI 답을 기다리는 동안 끊지 않는다 (연결 제한은 Gateway가 둔다: 스트림 요청 15초)
      timeout: 0,
      // Gateway가 이 헤더를 보고 스트림 라우트(긴 제한 시간)로 보낸다
      headers: { Accept: 'text/event-stream' },
    })
    .catch(withReadBody)
  const events = (await eventsOf(response)).map((item) => ({
    event: item.event,
    data: JSON.parse(item.data) as T,
  }))
  const logId = response.config.logId
  if (logId !== undefined) {
    const log = useApiFlowLog.getState()
    const issues = events.flatMap((item) => validate(item.data, shape))
    if (issues.length > 0) log.attachContractIssues(logId, issues)
    log.completeLog(logId, {
      responseBody: { events: events.map((item) => item.event), data: events.at(-1)?.data ?? null },
      durationMs: Math.round(performance.now() - startedAt),
    })
  }
  return events
}
