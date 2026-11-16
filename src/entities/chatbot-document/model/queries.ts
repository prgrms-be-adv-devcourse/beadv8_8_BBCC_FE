import { useQuery } from '@tanstack/react-query'
import { chatbotDocumentApi } from '../api/chatbot-document-api'
import { toChatbotDocument, toChatbotDocumentSummary } from './chatbot-document.mapper'

export const chatbotDocumentKeys = {
  all: ['chatbot-documents'] as const,
  lists: ['chatbot-documents', 'list'] as const,
  list: (page: number) => ['chatbot-documents', 'list', page] as const,
  detail: (documentId: string) => ['chatbot-documents', 'detail', documentId] as const,
}

export function useChatbotDocumentsQuery(page: number) {
  return useQuery({
    queryKey: chatbotDocumentKeys.list(page),
    queryFn: () => chatbotDocumentApi.list(page),
    select: (result) => ({ ...result, content: result.content.map(toChatbotDocumentSummary) }),
  })
}

export function useChatbotDocumentQuery(documentId: string) {
  return useQuery({
    queryKey: chatbotDocumentKeys.detail(documentId),
    queryFn: () => chatbotDocumentApi.get(documentId),
    select: toChatbotDocument,
  })
}
