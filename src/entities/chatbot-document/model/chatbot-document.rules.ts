import { CHATBOT_DOCUMENT_CATEGORIES, type ChatbotDocumentCategory } from './chatbot-document'

/** 주소의 ?page= (0부터). 잘못된 값이면 첫 페이지 */
export function chatbotDocumentPageOf(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 0
}

export function isChatbotDocumentCategory(value: string): value is ChatbotDocumentCategory {
  return (CHATBOT_DOCUMENT_CATEGORIES as string[]).includes(value)
}
