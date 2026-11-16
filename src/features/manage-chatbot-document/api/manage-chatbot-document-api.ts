import { chatbotDocumentShape } from '@/entities/chatbot-document'
import { apiClient, expectShape } from '@/shared/api'
import type { KnowledgeDocumentDto, KnowledgeDocumentRequestDto } from './chatbot-document.dto'

const DOCUMENTS_PATH = '/admin/chatbot/documents'

/** 저장 · 수정은 본문을 조각내 OpenAI로 임베딩해 오래 걸릴 수 있다 */
const EMBEDDING_TIMEOUT_MS = 60_000

/** 챗봇 답변 근거 문서 저장 · 수정 · 삭제 (BE AdminKnowledgeDocumentController). 조회는 entities/chatbot-document */
export const manageChatbotDocumentApi = {
  /** 201 + Location. 400 입력 · INVALID_CATEGORY, 503 AI_UNAVAILABLE(임베딩 실패, 저장 안 됨) */
  create: (request: KnowledgeDocumentRequestDto) =>
    apiClient
      .post<KnowledgeDocumentDto>(DOCUMENTS_PATH, request, { timeout: EMBEDDING_TIMEOUT_MS })
      .then(expectShape(chatbotDocumentShape)),
  /** 200. 제목 · 분류 · 본문을 모두 보내고 조각을 다시 만든다. 404 · 503(수정 안 됨) */
  update: (documentId: string, request: KnowledgeDocumentRequestDto) =>
    apiClient
      .put<KnowledgeDocumentDto>(`${DOCUMENTS_PATH}/${documentId}`, request, {
        timeout: EMBEDDING_TIMEOUT_MS,
      })
      .then(expectShape(chatbotDocumentShape)),
  /** 204. 조각도 함께 지운다. 404 DOCUMENT_NOT_FOUND */
  remove: (documentId: string) => apiClient.delete<void>(`${DOCUMENTS_PATH}/${documentId}`),
}
