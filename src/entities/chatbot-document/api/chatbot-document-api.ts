import { apiClient, expectShape, type Page } from '@/shared/api'
import type { KnowledgeDocumentDto, KnowledgeDocumentSummaryDto } from './chatbot-document.dto'
import { chatbotDocumentPageShape, chatbotDocumentShape } from './chatbot-document.shape'

export const CHATBOT_DOCUMENTS_PATH = '/admin/chatbot/documents'

/** 챗봇 답변 근거 문서 조회 (관리자). 저장 · 수정 · 삭제는 features/manage-chatbot-document */
export const chatbotDocumentApi = {
  /** 최신 문서부터. page 0부터, size 1~100 */
  list: (page: number) =>
    apiClient
      .get<Page<KnowledgeDocumentSummaryDto>>(CHATBOT_DOCUMENTS_PATH, {
        params: { page, size: 20 },
      })
      .then(expectShape(chatbotDocumentPageShape)),
  /** 404 DOCUMENT_NOT_FOUND */
  get: (documentId: string) =>
    apiClient
      .get<KnowledgeDocumentDto>(`${CHATBOT_DOCUMENTS_PATH}/${documentId}`)
      .then(expectShape(chatbotDocumentShape)),
}
