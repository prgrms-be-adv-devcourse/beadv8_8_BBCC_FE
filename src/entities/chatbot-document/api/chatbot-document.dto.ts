/** GET /admin/chatbot/documents/{id} 응답 (BE KnowledgeDocumentResponse). 저장 · 수정 응답도 같다 */
export type KnowledgeDocumentDto = {
  id: number
  title: string
  /** FAQ · POLICY · SIZE_GUIDE */
  category: string
  content: string
  /** 본문을 나눈 조각 수 (임베딩한 수) */
  chunkCount: number
  createdAt: string
  updatedAt: string
}

/** GET /admin/chatbot/documents 목록 한 줄 (BE KnowledgeDocumentSummaryResponse). 본문은 없다 */
export type KnowledgeDocumentSummaryDto = {
  id: number
  title: string
  category: string
  createdAt: string
  updatedAt: string
}
