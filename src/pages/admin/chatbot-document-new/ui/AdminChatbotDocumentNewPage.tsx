import { Link, useNavigate } from 'react-router'
import { CreateChatbotDocumentForm } from '@/features/manage-chatbot-document'
import { paths } from '@/shared/config'
import { PageHeader } from '@/shared/ui/PageHeader'

/** 등록하기 전에 알아 둘 것 */
const GUIDE = [
  {
    title: '분류',
    body: '자주 묻는 질문 · 정책(교환 · 반품 · 배송 등) · 사이즈 안내 중에서 골라요.',
  },
  {
    title: '본문',
    body: '문단(빈 줄)마다 나눠 저장해요. 한 문단에 한 가지 내용을 쓰면 챗봇이 더 잘 찾아요.',
  },
  {
    title: '저장',
    body: '저장할 때 AI로 본문을 읽어 두느라 몇 초 걸려요. AI를 쓸 수 없으면 저장되지 않아요.',
  },
]

/** 챗봇 문서 등록 (목록과 따로): 왼쪽 알아 둘 것, 오른쪽 폼. 저장하면 그 문서 상세로 */
export function AdminChatbotDocumentNewPage() {
  const navigate = useNavigate()

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
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <PageHeader
            title="문서 등록"
            description="챗봇이 이용 안내 질문에 답할 때 근거로 쓸 문서를 등록해요."
            note="POST /admin/chatbot/documents → 201 + chunkCount. 임베딩이 실패하면 503이고 저장되지 않는다"
          />
          <ol className="border-rule space-y-5 border-t pt-6">
            {GUIDE.map((item, index) => (
              <li key={item.title} className="flex gap-3.5">
                <span
                  aria-hidden
                  className="border-signal text-signal figure flex size-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold"
                >
                  {index + 1}
                </span>
                <div className="space-y-0.5 pt-0.5">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-ink-3 text-[13px]">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="border-rule rounded-xl border p-5 md:p-8">
          <CreateChatbotDocumentForm
            onCreated={(documentId) =>
              navigate(paths.admin.chatbotDocument(documentId), { replace: true })
            }
          />
        </div>
      </div>
    </div>
  )
}
