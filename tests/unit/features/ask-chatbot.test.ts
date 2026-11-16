import { describe, expect, it } from 'vitest'
import {
  CHAT_HISTORY_MAX,
  CHAT_HISTORY_CONTENT_MAX,
  CHAT_MESSAGE_MAX,
  chatErrorMessage,
  historyOf,
  toChatAnswer,
  toChatRequest,
  validateChatMessage,
  type ChatMessage,
} from '@/features/ask-chatbot'
import { chatResponseShape } from '@/features/ask-chatbot/api/chatbot.shape'
import { validate } from '@/shared/api'

const user = (id: number, content: string): ChatMessage => ({
  id: `u${id}`,
  role: 'user',
  content,
})
const assistant = (id: number, content: string): ChatMessage => ({
  id: `a${id}`,
  role: 'assistant',
  content,
  sources: [],
  products: [],
})

describe('챗봇 질문 검사 (BE ChatRequest: message 1~500자, 공백만은 안 됨)', () => {
  it('기준은 BE와 같다', () => {
    expect(CHAT_MESSAGE_MAX).toBe(500)
    expect(CHAT_HISTORY_MAX).toBe(10)
    expect(CHAT_HISTORY_CONTENT_MAX).toBe(1000)
  })

  it.each([
    ['', '물어볼 내용을 입력해 주세요.'],
    ['   ', '물어볼 내용을 입력해 주세요.'],
    ['가', null],
    ['가'.repeat(500), null],
    ['가'.repeat(501), '질문은 500자까지 쓸 수 있어요.'],
  ])('%j → %j', (text, expected) => {
    expect(validateChatMessage(text)).toBe(expected)
  })
})

describe('history: 오래된 것부터 최근 10개만 보낸다', () => {
  it('10개 이하면 그대로, 순서는 오래된 것부터', () => {
    const messages = [user(1, '원피스 추천'), assistant(1, '이 상품은 어때요?')]
    expect(historyOf(messages)).toEqual([
      { role: 'user', content: '원피스 추천' },
      { role: 'assistant', content: '이 상품은 어때요?' },
    ])
  })

  it('10개를 넘으면 앞쪽(오래된 것)을 버린다', () => {
    const messages = Array.from({ length: 12 }, (_, i) =>
      i % 2 === 0 ? user(i, `질문 ${i}`) : assistant(i, `답 ${i}`),
    )
    const history = historyOf(messages)
    expect(history).toHaveLength(10)
    expect(history[0]).toEqual({ role: 'user', content: '질문 2' })
    expect(history[9]).toEqual({ role: 'assistant', content: '답 11' })
  })

  it('긴 답은 1000자로 자르고, 빈 내용은 빼고 센다 (BE HistoryTurn: content 1~1000자)', () => {
    const history = historyOf([
      user(1, '질문'),
      assistant(1, '가'.repeat(1001)),
      assistant(2, '  '),
    ])
    expect(history).toEqual([
      { role: 'user', content: '질문' },
      { role: 'assistant', content: '가'.repeat(1000) },
    ])
  })
})

describe('요청 · 응답 매퍼', () => {
  it('질문은 앞뒤 공백을 빼고, history 역할은 USER · ASSISTANT로 보낸다', () => {
    expect(
      toChatRequest(' 내 주문 어디쯤 왔어? ', [
        { role: 'user', content: '안녕' },
        { role: 'assistant', content: '무엇을 도와드릴까요?' },
      ]),
    ).toEqual({
      message: '내 주문 어디쯤 왔어?',
      history: [
        { role: 'USER', content: '안녕' },
        { role: 'ASSISTANT', content: '무엇을 도와드릴까요?' },
      ],
    })
  })

  it('답 · 근거 문서 · 상품 카드: ID는 문자열, 없는 상호명 · 썸네일은 null', () => {
    const dto = {
      answer: '3만원 이하 원피스를 찾았어요.',
      sources: [{ documentId: 3, title: '사이즈 안내' }],
      products: [
        {
          productId: 11,
          name: '꽃무늬 원피스',
          businessName: null,
          price: 29000,
          thumbnailUrl: ' ',
          soldOut: true,
        },
      ],
    }
    expect(validate(dto, chatResponseShape)).toEqual([])
    expect(toChatAnswer(dto)).toEqual({
      content: '3만원 이하 원피스를 찾았어요.',
      sources: [{ documentId: '3', title: '사이즈 안내' }],
      products: [
        {
          id: '11',
          name: '꽃무늬 원피스',
          sellerName: null,
          price: 29000,
          thumbnailUrl: null,
          isSoldOut: true,
        },
      ],
    })
  })
})

describe('챗봇 오류 안내 (상태 코드로만 나눈다)', () => {
  it('429는 Retry-After 초를 안내한다', () => {
    expect(
      chatErrorMessage({
        status: 429,
        retryAfterSeconds: 30,
        message: '잠시 후 다시 시도해 주세요.',
      }),
    ).toBe('질문이 많아 잠시 쉬어 가요. 30초 뒤에 다시 물어봐 주세요.')
  })

  it('429인데 Retry-After가 없으면 서버 설명을 그대로', () => {
    expect(
      chatErrorMessage({
        status: 429,
        retryAfterSeconds: null,
        message: '잠시 후 다시 시도해 주세요.',
      }),
    ).toBe('잠시 후 다시 시도해 주세요.')
  })

  it('503 · 400 등은 ProblemDetail의 detail을 그대로', () => {
    expect(
      chatErrorMessage({
        status: 503,
        retryAfterSeconds: null,
        message: 'AI 서비스가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.',
      }),
    ).toBe('AI 서비스가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.')
  })
})
