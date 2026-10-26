import { Link } from 'react-router'
import { useMeasurementItemsQuery } from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 실측 항목(목록): 제목 줄의 「실측 항목 만들기」, 실측 항목 표 */
export function AdminCatalogMeasurementItemsPage() {
  const items = useMeasurementItemsQuery()

  return (
    <div className="shop-look space-y-6">
      <PageHeader
        title="실측 항목"
        description="판매자가 사이즈마다 재서 적는 길이(총장 · 가슴단면 등)예요. 말단 카테고리를 만들 때 필수 실측 항목으로 골라요."
        note="GET · POST /admin/measurement-items. 코드는 실측 값의 키라 대문자와 _만 받고, 겹치면 409"
        actions={
          <Link
            to={paths.admin.measurementItemNew}
            className="shop-btn min-h-10 shrink-0 px-4 text-sm max-lg:min-h-11"
          >
            실측 항목 만들기
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-section">
          실측 항목
          {items.data && (
            <span className="figure text-ink-3 ml-2 text-sm font-medium">
              {items.data.length}개
            </span>
          )}
        </h2>
        {items.isPending && <ListSkeleton />}
        {items.isError && <StateMessage tone="error">{getErrorMessage(items.error)}</StateMessage>}
        {items.data?.length === 0 && <StateMessage>실측 항목이 없어요.</StateMessage>}
        {items.data && items.data.length > 0 && (
          <table aria-label="실측 항목" className="w-full text-sm">
            <thead>
              <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
                <th scope="col" className="py-2 pr-4 font-medium">
                  이름
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  코드
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  단위
                </th>
              </tr>
            </thead>
            <tbody>
              {items.data.map((item) => (
                <tr key={item.id} className="border-rule border-b">
                  <td className="py-3 pr-4 align-middle font-semibold">{item.name}</td>
                  <td className="figure text-ink-2 py-3 pr-4 align-middle break-all">
                    {item.code}
                  </td>
                  <td className="text-ink-2 py-3 text-right align-middle">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
