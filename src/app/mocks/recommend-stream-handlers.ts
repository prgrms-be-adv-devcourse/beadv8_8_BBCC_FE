import { isAxiosError } from 'axios'
import type { CompanionProductsDto } from '@/entities/recommendation'
import type { MockHandler, MockRequest, MockResult } from '@/shared/api'
import { fetchReal, loadMockState, saveMockState } from './mock-utils'

// 함께 사면 · 홈 맛보기 SSE (BE SSE 머지 전, FE #290). 실제 서버의 JSON 응답을 받아 BE 계약대로 흘려보낸다
// - 서버가 AI로 답했고 처음 묻는 요청이면 rule(같은 상품, 이유 없음) → AI를 기다린 뒤 ai
// - 같은 요청을 다시 하면 저장해 둔 AI 답처럼 ai만
// - 서버가 규칙으로 답하면(AI 꺼짐 · 실패) rule만
const KEY = 'recommend-stream-answered'
/** AI 답을 기다리는 시간 흉내 */
const AI_WAIT_MS = 1500

type PicksDto = CompanionProductsDto

async function streamOf(request: MockRequest, path: string): Promise<MockResult> {
  const url = `${path}?${request.query.toString()}`
  let answer: PicksDto
  try {
    answer = await fetchReal<PicksDto>(request, url)
  } catch (error) {
    // 스트림을 열기 전 오류(400 · 401 · 403 · 404 · 504)는 상태 코드 + ProblemDetail 그대로
    if (isAxiosError(error) && error.response)
      return { status: error.response.status, data: error.response.data }
    throw error
  }
  if (answer.source === 'RULE') return { status: 200, events: [{ event: 'rule', data: answer }] }
  const answered = loadMockState<string[]>(KEY, [])
  if (answered.includes(url)) return { status: 200, events: [{ event: 'ai', data: answer }] }
  saveMockState(KEY, [...answered, url])
  const rule = {
    source: 'RULE',
    products: answer.products.map((product) => ({ ...product, reason: null })),
  }
  return {
    status: 200,
    events: [
      { event: 'rule', data: rule },
      { event: 'ai', data: answer, delayMs: AI_WAIT_MS },
    ],
  }
}

export const recommendStreamHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/recommendations/products/preview',
    handle: (request) => streamOf(request, '/recommendations/products/preview'),
  },
  {
    method: 'GET',
    path: '/recommendations/companions',
    handle: (request) => streamOf(request, '/recommendations/companions'),
  },
]
