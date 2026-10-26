import { Link, useNavigate } from 'react-router'
import { CreateMeasurementItemForm } from '@/features/manage-catalog'
import { paths } from '@/shared/config'
import { PageHeader } from '@/shared/ui/PageHeader'

/** 만들기 전에 알아 둘 것 */
const GUIDE = [
  {
    title: '이름과 코드',
    body: '코드는 대문자와 _만 써요. 판매자가 적은 실측 값의 이름표라 만든 뒤에는 바꿀 수 없어요.',
  },
  { title: '단위', body: '옷 길이는 보통 cm예요.' },
  {
    title: '카테고리에 연결',
    body: '말단 카테고리를 만들 때 필수 실측 항목으로 고르면, 그 카테고리의 실측표 열이 돼요.',
  },
]

/** 실측 항목 만들기 (목록과 따로): 왼쪽 알아 둘 것, 오른쪽 폼. 만들면 목록으로 */
export function AdminCatalogMeasurementItemNewPage() {
  const navigate = useNavigate()

  return (
    <div className="shop-look space-y-6">
      <Link
        to={paths.admin.measurementItems}
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
        실측 항목
      </Link>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <PageHeader
            title="실측 항목 만들기"
            description="판매자가 사이즈마다 재서 적는 길이를 만들어요."
            note="POST /admin/measurement-items. 코드가 겹치면 409"
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
          <CreateMeasurementItemForm
            onCreated={() => navigate(paths.admin.measurementItems, { replace: true })}
          />
        </div>
      </div>
    </div>
  )
}
