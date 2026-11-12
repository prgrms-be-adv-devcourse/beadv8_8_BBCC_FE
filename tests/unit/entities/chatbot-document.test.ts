import { describe, expect, it } from 'vitest'
import {
  CHATBOT_DOCUMENT_CATEGORY_LABEL,
  chatbotDocumentPageOf,
  chatbotDocumentPageShape,
  chatbotDocumentShape,
  toChatbotDocument,
  toChatbotDocumentSummary,
} from '@/entities/chatbot-document'
import {
  CHATBOT_DOCUMENT_CONTENT_MAX,
  CHATBOT_DOCUMENT_TITLE_MAX,
  toChatbotDocumentForm,
  toChatbotDocumentRequest,
  validateChatbotDocumentForm,
} from '@/features/manage-chatbot-document'
import { validate } from '@/shared/api'

const detailDto = {
  id: 5,
  title: '교환 · 반품 정책',
  category: 'POLICY',
  content: '받은 날부터 7일 안에 교환할 수 있어요.',
  chunkCount: 1,
  createdAt: '2026-11-12T10:00:00',
  updatedAt: '2026-11-12T11:00:00',
}

describe('챗봇 문서 매퍼 (BE KnowledgeDocumentResponse · SummaryResponse)', () => {
  it('상세: ID는 문자열, 나머지는 그대로', () => {
    expect(validate(detailDto, chatbotDocumentShape)).toEqual([])
    expect(toChatbotDocument(detailDto)).toEqual({ ...detailDto, id: '5' })
  })

  it('목록: 본문 없이 PageResponse로 온다', () => {
    const summary = {
      id: 5,
      title: '교환 · 반품 정책',
      category: 'POLICY',
      createdAt: '2026-11-12T10:00:00',
      updatedAt: '2026-11-12T11:00:00',
    }
    const page = {
      content: [summary],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    }
    expect(validate(page, chatbotDocumentPageShape)).toEqual([])
    expect(toChatbotDocumentSummary(summary)).toEqual({ ...summary, id: '5' })
  })

  it('분류 라벨은 BE KnowledgeCategory 세 가지', () => {
    expect(CHATBOT_DOCUMENT_CATEGORY_LABEL).toEqual({
      FAQ: '자주 묻는 질문',
      POLICY: '정책',
      SIZE_GUIDE: '사이즈 안내',
    })
  })

  it('주소의 페이지는 0 이상 정수만', () => {
    expect(chatbotDocumentPageOf('2')).toBe(2)
    expect(chatbotDocumentPageOf(null)).toBe(0)
    expect(chatbotDocumentPageOf('-1')).toBe(0)
    expect(chatbotDocumentPageOf('a')).toBe(0)
  })
})

describe('챗봇 문서 폼 (BE KnowledgeDocumentRequest: 제목 1~200 · 본문 1~20,000자)', () => {
  it('기준은 BE와 같다', () => {
    expect(CHATBOT_DOCUMENT_TITLE_MAX).toBe(200)
    expect(CHATBOT_DOCUMENT_CONTENT_MAX).toBe(20_000)
  })

  const valid = { title: '사이즈 표', category: 'SIZE_GUIDE' as const, content: '90 · 100 · 110' }

  it.each([
    [valid, null],
    [{ ...valid, title: '  ' }, '제목을 입력해 주세요.'],
    [{ ...valid, title: '가'.repeat(201) }, '제목은 200자까지 쓸 수 있어요.'],
    [{ ...valid, title: '가'.repeat(200) }, null],
    [{ ...valid, content: '' }, '본문을 입력해 주세요.'],
    [{ ...valid, content: '가'.repeat(20_001) }, '본문은 20,000자까지 쓸 수 있어요.'],
    [{ ...valid, content: '가'.repeat(20_000) }, null],
  ])('%#', (form, expected) => {
    expect(validateChatbotDocumentForm(form)).toBe(expected)
  })

  it('요청은 제목 앞뒤 공백만 빼고 본문은 그대로 보낸다', () => {
    expect(toChatbotDocumentRequest({ ...valid, title: ' 사이즈 표 ', content: '\n90\n' })).toEqual(
      { title: '사이즈 표', category: 'SIZE_GUIDE', content: '\n90\n' },
    )
  })

  it('수정 폼은 상세에서 채운다. 모르는 분류면 FAQ로 고르게 둔다', () => {
    const document = toChatbotDocument(detailDto)
    expect(toChatbotDocumentForm(document)).toEqual({
      title: '교환 · 반품 정책',
      category: 'POLICY',
      content: '받은 날부터 7일 안에 교환할 수 있어요.',
    })
    expect(toChatbotDocumentForm({ ...document, category: 'NEW' }).category).toBe('FAQ')
  })
})
