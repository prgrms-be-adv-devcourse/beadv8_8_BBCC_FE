import type { KnowledgeDocumentDto, KnowledgeDocumentSummaryDto } from '../api/chatbot-document.dto'
import type { ChatbotDocument, ChatbotDocumentSummary } from './chatbot-document'

export function toChatbotDocumentSummary(dto: KnowledgeDocumentSummaryDto): ChatbotDocumentSummary {
  return {
    id: String(dto.id),
    title: dto.title,
    category: dto.category,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

export function toChatbotDocument(dto: KnowledgeDocumentDto): ChatbotDocument {
  return { ...toChatbotDocumentSummary(dto), content: dto.content, chunkCount: dto.chunkCount }
}
