import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatbotDocumentKeys, toChatbotDocument } from '@/entities/chatbot-document'
import { runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { manageChatbotDocumentApi } from '../api/manage-chatbot-document-api'
import { toChatbotDocumentRequest, type ChatbotDocumentForm } from './chatbot-document-form'

function useRefetchDocuments(message: string) {
  const queryClient = useQueryClient()
  return () => {
    toast(message)
    return queryClient.invalidateQueries({ queryKey: chatbotDocumentKeys.all })
  }
}

/** 문서 저장. 만든 문서를 돌려준다 (상세로 이동). 임베딩이 실패하면 503이고 저장되지 않는다 */
export function useCreateChatbotDocument() {
  const onSuccess = useRefetchDocuments('문서를 저장했어요')
  return useMutation({
    mutationFn: (form: ChatbotDocumentForm) =>
      runWithAction('챗봇 문서 저장', () =>
        manageChatbotDocumentApi.create(toChatbotDocumentRequest(form)),
      ).then(toChatbotDocument),
    onSuccess,
  })
}

/** 문서 수정 (PUT, 전체 필드). 조각을 다시 만든다 */
export function useUpdateChatbotDocument(documentId: string) {
  const onSuccess = useRefetchDocuments('문서를 고쳤어요')
  return useMutation({
    mutationFn: (form: ChatbotDocumentForm) =>
      runWithAction('챗봇 문서 수정', () =>
        manageChatbotDocumentApi.update(documentId, toChatbotDocumentRequest(form)),
      ).then(toChatbotDocument),
    onSuccess,
  })
}

/** 문서 삭제 (204). 지운 상세는 다시 읽지 않고(404) 목록만 다시 읽는다 */
export function useDeleteChatbotDocument(documentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      runWithAction('챗봇 문서 삭제', () => manageChatbotDocumentApi.remove(documentId)),
    onSuccess: () => {
      toast('문서를 지웠어요')
      return queryClient.invalidateQueries({ queryKey: chatbotDocumentKeys.lists })
    },
  })
}
