import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { useDeleteChatbotDocument } from '../model/use-manage-chatbot-document'

type DeleteChatbotDocumentButtonProps = {
  documentId: string
  title: string
  onDeleted?: () => void
}

/** 챗봇 문서 지우기: 확인을 받고 요청 중에는 막는다. 지우면 다음 질문부터 챗봇이 쓰지 않는다 */
export function DeleteChatbotDocumentButton({
  documentId,
  title,
  onDeleted,
}: DeleteChatbotDocumentButtonProps) {
  const remove = useDeleteChatbotDocument(documentId)

  const handleClick = async () => {
    const isConfirmed = await confirmAction({
      title: `「${title}」 문서를 지울까요?`,
      description: '지우면 챗봇이 이 문서로 답하지 않아요. 되돌릴 수 없어요.',
      confirmLabel: '삭제',
      tone: 'danger',
    })
    if (isConfirmed) remove.mutate(undefined, { onSuccess: () => onDeleted?.() })
  }

  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-2">
      <button
        type="button"
        disabled={remove.isPending}
        aria-busy={remove.isPending}
        onClick={handleClick}
        className="text-destructive inline-flex min-h-10 items-center text-[13px] font-semibold hover:underline disabled:opacity-50"
      >
        문서 삭제
      </button>
      {remove.isError && (
        <span role="alert" className="text-destructive text-[13px]">
          {getErrorMessage(remove.error)}
        </span>
      )}
    </span>
  )
}
