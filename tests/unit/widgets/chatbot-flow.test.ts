import { describe, expect, it } from 'vitest'
import { domainOf, flowOf } from '@/widgets/api-flow-panel/config/domain-flow'

describe('챗봇 호출의 도메인 · 이어지는 처리', () => {
  it('회원 질문 · 관리자 문서 관리는 챗봇 도메인', () => {
    for (const path of [
      '/chatbot/messages',
      '/admin/chatbot/documents?page=0&size=20',
      '/admin/chatbot/documents/5',
    ])
      expect(domainOf(path)).toBe('chatbot')
  })

  it('질문하면 상품 검색 · 내 주문 조회 · OpenAI를 부를 수 있다 (설계 기준)', () => {
    const steps = flowOf('POST', '/chatbot/messages')
    expect(steps.flatMap((step) => step.to)).toEqual(['product', 'order', 'openai'])
  })

  it('문서를 저장 · 수정하면 OpenAI 임베딩을 부른다', () => {
    expect(flowOf('POST', '/admin/chatbot/documents')[0].to).toEqual(['openai'])
    expect(flowOf('PUT', '/admin/chatbot/documents/5')[0].to).toEqual(['openai'])
    expect(flowOf('DELETE', '/admin/chatbot/documents/5')).toEqual([])
  })
})
