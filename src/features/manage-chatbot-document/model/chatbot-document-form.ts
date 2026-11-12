import {
  isChatbotDocumentCategory,
  type ChatbotDocument,
  type ChatbotDocumentCategory,
} from '@/entities/chatbot-document'
import type { KnowledgeDocumentRequestDto } from '../api/chatbot-document.dto'

/** BE KnowledgeDocumentRequest: title 1~200자 */
export const CHATBOT_DOCUMENT_TITLE_MAX = 200
/** BE KnowledgeDocumentRequest: content 1~20,000자 */
export const CHATBOT_DOCUMENT_CONTENT_MAX = 20_000

export type ChatbotDocumentForm = {
  title: string
  category: ChatbotDocumentCategory
  content: string
}

export const EMPTY_CHATBOT_DOCUMENT_FORM: ChatbotDocumentForm = {
  title: '',
  category: 'FAQ',
  content: '',
}

export function validateChatbotDocumentForm(form: ChatbotDocumentForm): string | null {
  const title = form.title.trim()
  if (!title) return '제목을 입력해 주세요.'
  if (title.length > CHATBOT_DOCUMENT_TITLE_MAX)
    return `제목은 ${CHATBOT_DOCUMENT_TITLE_MAX}자까지 쓸 수 있어요.`
  if (!form.content.trim()) return '본문을 입력해 주세요.'
  if (form.content.length > CHATBOT_DOCUMENT_CONTENT_MAX)
    return `본문은 ${CHATBOT_DOCUMENT_CONTENT_MAX.toLocaleString('ko-KR')}자까지 쓸 수 있어요.`
  return null
}

/** 수정 폼은 상세에서 채운다. 화면이 모르는 분류면 고를 수 있는 첫 분류로 둔다 */
export function toChatbotDocumentForm(document: ChatbotDocument): ChatbotDocumentForm {
  return {
    title: document.title,
    category: isChatbotDocumentCategory(document.category) ? document.category : 'FAQ',
    content: document.content,
  }
}

/** 제목 앞뒤 공백만 뺀다. 본문은 문단 나누기에 쓰이므로 그대로 보낸다 */
export function toChatbotDocumentRequest(form: ChatbotDocumentForm): KnowledgeDocumentRequestDto {
  return { title: form.title.trim(), category: form.category, content: form.content }
}
