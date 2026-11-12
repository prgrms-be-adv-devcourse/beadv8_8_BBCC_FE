import axios, { type AxiosResponse } from 'axios'
import { useApiFlowLog } from './api-flow-log'
import { apiClient } from './client'
import { validate, type Shape } from './contract'
import { readSse, readSseEvents, type SseEvent } from './sse'

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

/**
 * 받은 이벤트를 하나씩 onEvent로 넘긴다. 읽다가 끊기면 그때까지 받은 것으로 끝내고, 하나도 받지 못했으면 오류를 던진다.
 * 서버가 스트림 대신 JSON으로 답하면(Accept를 무시한 서버 · 테스트 응답) 그 응답을 이벤트 하나('message')로 본다
 */
async function readEvents(
  response: AxiosResponse<ReadableStream<Uint8Array>>,
  onEvent: (event: SseEvent) => void,
): Promise<void> {
  const contentType = String(response.headers['content-type'] ?? '')
  if (!contentType.includes('application/json')) {
    await readSseEvents(response.data, onEvent)
    return
  }
  onEvent({ event: 'message', data: await new Response(response.data).text() })
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

/** 스트림 요청을 연다. 응답 헤더까지 받으면 끝나고, 본문은 호출한 쪽이 읽는다 */
function requestStream(path: string, params?: Record<string, string>, signal?: AbortSignal) {
  return apiClient
    .get<ReadableStream<Uint8Array>>(path, {
      params,
      signal,
      adapter: streamAdapter,
      responseType: 'stream',
      // 서버가 닫을 때까지 끊지 않는다 (연결 제한은 Gateway가 둔다)
      timeout: 0,
      // Gateway가 이 헤더를 보고 스트림 라우트(긴 제한 시간)로 보낸다
      headers: { Accept: 'text/event-stream' },
    })
    .catch(withReadBody)
}

type CollectEventStreamOptions<T> = GetEventStreamOptions & {
  /** 이벤트가 올 때마다 부른다 (닫히기 전에 먼저 온 결과를 그리려고) */
  onEvent?: (event: StreamEvent<T>) => void
}

/**
 * text/event-stream을 공통 클라이언트로 받아 닫힐 때까지 모은다 (토큰 · 401 재발급 · 흐름 기록을 그대로 쓴다).
 * 이벤트 data는 JSON으로 읽어 계약 모양을 검사하고, 이벤트가 올 때마다 흐름 기록에 받은 이벤트 순서 · 마지막 data · 걸린 시간을 고친 뒤 onEvent를 부른다.
 * 스트림을 열기 전 오류(400 · 401 · 403 · 404)는 지금처럼 axios 오류로 던진다
 */
export async function getEventStream<T>(
  path: string,
  { params, signal, shape, onEvent }: CollectEventStreamOptions<T>,
): Promise<StreamEvent<T>[]> {
  const startedAt = performance.now()
  const response = await requestStream(path, params, signal)
  const logId = response.config.logId
  const events: StreamEvent<T>[] = []
  const record = () => {
    if (logId === undefined) return
    useApiFlowLog.getState().completeLog(logId, {
      responseBody: { events: events.map((item) => item.event), data: events.at(-1)?.data ?? null },
      durationMs: Math.round(performance.now() - startedAt),
    })
  }
  await readEvents(response, (item) => {
    const event = { event: item.event, data: JSON.parse(item.data) as T }
    events.push(event)
    const issues = validate(event.data, shape)
    if (logId !== undefined && issues.length > 0)
      useApiFlowLog.getState().attachContractIssues(logId, issues)
    record()
    onEvent?.(event)
  })
  // 닫힌 시각까지 걸린 시간 (이벤트 없이 닫혀도 남긴다)
  record()
  return events
}

type OpenEventStreamOptions<T> = GetEventStreamOptions & {
  signal: AbortSignal
  onEvent: (event: StreamEvent<T>) => void
}

/**
 * 서버가 닫을 때까지 열어 두는 스트림(알림 수 등). 이벤트가 올 때마다 onEvent를 부르고, 서버가 닫으면 끝난다.
 * 연결 하나가 흐름 기록 한 건이고, 그 기록에는 마지막 이벤트만 남긴다 (이벤트마다 기록이 쌓이지 않게).
 * 토큰 · 401 재발급은 공통 클라이언트를 그대로 쓰고, 열기 전 오류는 axios 오류로 던진다
 */
export async function openEventStream<T>(
  path: string,
  { params, signal, shape, onEvent }: OpenEventStreamOptions<T>,
): Promise<void> {
  const response = await requestStream(path, params, signal)
  const logId = response.config.logId
  await readSse(response.data, (item) => {
    if (signal.aborted) return
    const event = { event: item.event, data: JSON.parse(item.data) as T }
    if (logId !== undefined) {
      const log = useApiFlowLog.getState()
      const issues = validate(event.data, shape)
      if (issues.length > 0) log.attachContractIssues(logId, issues)
      log.completeLog(logId, { responseBody: event })
    }
    onEvent(event)
  })
}
