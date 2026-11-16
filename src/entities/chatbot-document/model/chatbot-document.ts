/** BE KnowledgeCategory */
export type ChatbotDocumentCategory = 'FAQ' | 'POLICY' | 'SIZE_GUIDE'

export const CHATBOT_DOCUMENT_CATEGORY_LABEL: Record<ChatbotDocumentCategory, string> = {
  FAQ: '자주 묻는 질문',
  POLICY: '정책',
  SIZE_GUIDE: '사이즈 안내',
}

export const CHATBOT_DOCUMENT_CATEGORIES = Object.keys(
  CHATBOT_DOCUMENT_CATEGORY_LABEL,
) as ChatbotDocumentCategory[]

/** 목록 한 줄 (본문 없음) */
export type ChatbotDocumentSummary = {
  id: string
  title: string
  /** 서버가 새 분류를 더할 수 있어 글자로 둔다 (라벨은 labelOf) */
  category: string
  createdAt: string
  updatedAt: string
}

/** 문서 상세 */
export type ChatbotDocument = ChatbotDocumentSummary & {
  content: string
  /** 챗봇이 답할 때 찾는 조각 수 */
  chunkCount: number
}
