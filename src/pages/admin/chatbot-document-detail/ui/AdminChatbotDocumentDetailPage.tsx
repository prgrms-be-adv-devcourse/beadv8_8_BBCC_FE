import { Link, useNavigate, useParams } from 'react-router'
import {
  CHATBOT_DOCUMENT_CATEGORY_LABEL,
  useChatbotDocumentQuery,
} from '@/entities/chatbot-document'
import {
  DeleteChatbotDocumentButton,
  EditChatbotDocumentForm,
} from '@/features/manage-chatbot-document'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime, labelOf } from '@/shared/lib'
import { DetailList } from '@/shared/ui/DetailList'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 챗봇 문서 상세: 왼쪽 분류 · 조각 수 · 시각과 삭제, 오른쪽 수정 폼 (저장하면 조각을 다시 만든다) */
export function AdminChatbotDocumentDetailPage() {
  const { documentId = '' } = useParams()
  const navigate = useNavigate()
  const detail = useChatbotDocumentQuery(documentId)
  const toList = () => navigate(paths.admin.chatbotDocuments, { replace: true })

  return (
    <div className="shop-look space-y-6">
      <Link
        to={paths.admin.chatbotDocuments}
        className="text-ink-3 hover:text-ink active:text-ink-2 inline-flex min-h-11 items-center gap-1 rounded-md text-[13px] font-semibold transition-colors lg:min-h-0"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        챗봇 답변 문서
      </Link>
      {detail.isPending && <ListSkeleton rows={2} />}
      {detail.isError && <StateMessage tone="error">{getErrorMessage(detail.error)}</StateMessage>}
      {detail.data && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <PageHeader
              title={detail.data.title}
              description="고쳐 저장하면 본문을 다시 나눠 읽어 두고, 다음 질문부터 고친 내용으로 답해요."
              note="GET · PUT · DELETE /admin/chatbot/documents/{id}. PUT은 제목 · 분류 · 본문을 모두 보내고 조각을 다시 만든다(임베딩 실패 503이면 바뀌지 않음)"
            />
            <DetailList
              items={[
                {
                  label: '분류',
                  value: labelOf(CHATBOT_DOCUMENT_CATEGORY_LABEL, detail.data.category),
                },
                { label: '조각 수', value: `${detail.data.chunkCount}개` },
                { label: '등록', value: formatDateTime(detail.data.createdAt) },
                { label: '고침', value: formatDateTime(detail.data.updatedAt) },
              ]}
            />
            <DeleteChatbotDocumentButton
              documentId={detail.data.id}
              title={detail.data.title}
              onDeleted={toList}
            />
          </div>
          <div className="border-rule rounded-xl border p-5 md:p-8">
            {/* 다시 읽은 상세로 폼을 새로 채운다 */}
            <EditChatbotDocumentForm key={detail.data.updatedAt} document={detail.data} />
          </div>
        </div>
      )}
    </div>
  )
}
