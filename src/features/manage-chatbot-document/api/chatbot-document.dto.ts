/** POST · PUT /admin/chatbot/documents (BE KnowledgeDocumentRequest: title 1~200 · category · content 1~20,000자) */
export type KnowledgeDocumentRequestDto = {
  title: string
  category: string
  content: string
}

/** 저장 · 수정 응답 (BE KnowledgeDocumentResponse). 모양은 엔티티 chatbotDocumentShape로 검사하고, 엔티티 매퍼 toChatbotDocument로 화면 모델을 만든다 */
export type KnowledgeDocumentDto = {
  id: number
  title: string
  category: string
  content: string
  chunkCount: number
  createdAt: string
  updatedAt: string
}
