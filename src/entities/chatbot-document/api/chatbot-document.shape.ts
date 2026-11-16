import { num, obj, pageOf, str } from '@/shared/api'

// BE AdminKnowledgeDocumentController (#1191). 분류는 늘어날 수 있어 글자로 받는다
export const chatbotDocumentSummaryShape = obj({
  id: num,
  title: str,
  category: str,
  createdAt: str,
  updatedAt: str,
})

export const chatbotDocumentPageShape = pageOf(chatbotDocumentSummaryShape)

export const chatbotDocumentShape = obj({
  id: num,
  title: str,
  category: str,
  content: str,
  chunkCount: num,
  createdAt: str,
  updatedAt: str,
})
