import { Link, useNavigate } from 'react-router'
import { CreateAttributeForm } from '@/features/manage-catalog'
import { paths } from '@/shared/config'
import { PageHeader } from '@/shared/ui/PageHeader'

/** 만들기 전에 알아 둘 것 */
const GUIDE = [
  {
    title: '이름과 코드',
    body: '코드는 대문자와 _만 써요. 상품 목록을 거를 때 쓰여서 만든 뒤에는 바꿀 수 없어요.',
  },
  {
    title: '입력 방식',
    body: '색 팔레트 · 목록은 판매자가 값을 고르고, 직접 입력은 판매자가 글자로 적어요.',
  },
  { title: '목록 값', body: '값은 만든 뒤에도 항목 화면에서 더할 수 있어요.' },
]

/** 항목 만들기 (목록과 따로): 왼쪽 알아 둘 것, 오른쪽 폼. 만들면 그 항목 상세로 */
export function AdminCatalogAttributeNewPage() {
  const navigate = useNavigate()

  return (
    <div className="shop-look space-y-6">
      <Link
        to={paths.admin.attributes}
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
        항목 · 목록 값
      </Link>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <PageHeader
            title="항목 만들기"
            description="판매자가 상품을 등록할 때 고르거나 적는 항목을 만들어요."
            note="POST /admin/attributes (목록 값 함께). 코드가 겹치면 409"
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
          <CreateAttributeForm
            onCreated={(attribute) =>
              navigate(paths.admin.attribute(attribute.id), { replace: true })
            }
          />
        </div>
      </div>
    </div>
  )
}
