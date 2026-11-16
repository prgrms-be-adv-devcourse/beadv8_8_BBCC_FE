import { Link, useSearchParams } from 'react-router'
import {
  CHATBOT_DOCUMENT_CATEGORY_LABEL,
  chatbotDocumentPageOf,
  useChatbotDocumentsQuery,
} from '@/entities/chatbot-document'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime, labelOf } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 챗봇 답변 문서(목록): 최신순 표 · 페이지, 제목 줄의 「문서 등록」. 문서를 누르면 상세에서 수정 · 삭제 */
export function AdminChatbotDocumentsPage() {
  // 페이지는 주소(?page=)에 둔다 → 상세에서 돌아와도 그대로
  const [params, setParams] = useSearchParams()
  const page = chatbotDocumentPageOf(params.get('page'))
  const documents = useChatbotDocumentsQuery(page)
  const rows = documents.data?.content ?? []

  return (
    <div className="shop-look space-y-6">
      <PageHeader
        title="챗봇 답변 문서"
        description="챗봇이 이용 안내 질문에 답할 때 근거로 쓰는 FAQ · 정책 · 사이즈 안내예요. 저장한 문서는 다음 질문부터 쓰여요."
        note="GET /admin/chatbot/documents?page= (최신순, 본문 없음). 저장 · 수정하면 본문을 800자 안팎 조각으로 나눠 OpenAI 임베딩으로 바꿔 둔다(BE #1191)"
        actions={
          <Link
            to={paths.admin.chatbotDocumentNew}
            className="shop-btn min-h-10 shrink-0 px-4 text-sm max-lg:min-h-11"
          >
            문서 등록
          </Link>
        }
      />
      <section className="space-y-3">
        <h2 className="text-section">
          문서
          {documents.data && (
            <span className="figure text-ink-3 ml-2 text-sm font-medium">
              {documents.data.totalElements}건
            </span>
          )}
        </h2>
        {documents.isPending && <ListSkeleton />}
        {documents.isError && (
          <StateMessage tone="error">{getErrorMessage(documents.error)}</StateMessage>
        )}
        {documents.data && rows.length === 0 && (
          <StateMessage>
            등록한 문서가 없어요. 문서를 등록하면 챗봇이 그 내용으로 답해요.
          </StateMessage>
        )}
        {rows.length > 0 && (
          <table aria-label="챗봇 답변 문서" className="w-full text-sm max-md:block">
            <thead className="max-md:sr-only">
              <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
                <th scope="col" className="py-2 pr-4 font-medium">
                  제목
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  분류
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  고친 시각
                </th>
              </tr>
            </thead>
            <tbody className="max-md:block">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-rule border-b max-md:flex max-md:flex-col max-md:gap-1 max-md:py-3"
                >
                  <td className="py-3 pr-4 align-middle max-md:p-0">
                    <Link
                      to={paths.admin.chatbotDocument(row.id)}
                      className="text-ink hover:text-signal active:text-signal-deep inline-flex items-center font-semibold transition-colors max-md:min-h-11"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="text-ink-2 py-3 pr-4 align-middle max-md:p-0">
                    {labelOf(CHATBOT_DOCUMENT_CATEGORY_LABEL, row.category)}
                  </td>
                  <td className="figure text-ink-2 py-3 text-right align-middle max-md:p-0 max-md:text-left">
                    {formatDateTime(row.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {documents.data && (
          <Pagination
            page={documents.data.page}
            totalPages={documents.data.totalPages}
            onChange={(next) => setParams(next ? { page: String(next) } : {}, { replace: true })}
          />
        )}
      </section>
    </div>
  )
}
