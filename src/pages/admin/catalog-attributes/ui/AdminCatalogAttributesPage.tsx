import { Link } from 'react-router'
import { ATTRIBUTE_INPUT_TYPE_LABEL, hasValueList, useAttributesQuery } from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 항목 · 목록 값(목록): 제목 줄의 「항목 만들기」, 항목 표. 목록 값 더하기는 항목 상세에서 */
export function AdminCatalogAttributesPage() {
  const attributes = useAttributesQuery()

  return (
    <div className="shop-look space-y-6">
      <PageHeader
        title="항목 · 목록 값"
        description="판매자가 상품을 등록할 때 고르는 항목(색상 · 사이즈 · 소재 등)과 그 목록 값이에요. 이미 만든 코드는 바꿀 수 없어요."
        note="GET · POST /admin/attributes, POST /admin/attributes/{id}/values. 코드는 상품 목록 필터의 키라 대문자와 _만 받고, 겹치면 409"
        actions={
          <Link
            to={paths.admin.attributeNew}
            className="shop-btn min-h-10 shrink-0 px-4 text-sm max-lg:min-h-11"
          >
            항목 만들기
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-section">
          항목
          {attributes.data && (
            <span className="figure text-ink-3 ml-2 text-sm font-medium">
              {attributes.data.length}개
            </span>
          )}
        </h2>
        {attributes.isPending && <ListSkeleton />}
        {attributes.isError && (
          <StateMessage tone="error">{getErrorMessage(attributes.error)}</StateMessage>
        )}
        {attributes.data?.length === 0 && <StateMessage>항목이 없어요.</StateMessage>}
        {attributes.data && attributes.data.length > 0 && (
          <table aria-label="항목" className="w-full text-sm max-md:block">
            <thead className="max-md:sr-only">
              <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
                <th scope="col" className="py-2 pr-4 font-medium">
                  항목 이름
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  코드
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  입력 방식
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  목록 값
                </th>
              </tr>
            </thead>
            <tbody className="max-md:block">
              {attributes.data.map((attribute) => (
                <tr
                  key={attribute.id}
                  className="border-rule border-b max-md:flex max-md:flex-col max-md:gap-1 max-md:py-3"
                >
                  <td className="py-3 pr-4 align-middle max-md:p-0">
                    <Link
                      to={paths.admin.attribute(attribute.id)}
                      className="text-ink hover:text-signal active:text-signal-deep inline-flex items-center font-semibold transition-colors max-md:min-h-11"
                    >
                      {attribute.name}
                    </Link>
                  </td>
                  <td className="figure text-ink-2 py-3 pr-4 align-middle max-md:p-0">
                    {attribute.code}
                  </td>
                  <td className="text-ink-2 py-3 pr-4 align-middle max-md:p-0">
                    {ATTRIBUTE_INPUT_TYPE_LABEL[attribute.inputType]}
                  </td>
                  <td className="figure text-ink-2 py-3 text-right align-middle max-md:p-0 max-md:text-left">
                    {hasValueList(attribute.inputType) ? (
                      <>
                        <span className="text-ink-3 mr-1 text-[13px] md:hidden">목록 값</span>
                        {attribute.values.length}개
                      </>
                    ) : (
                      <span className="text-ink-3 max-md:hidden">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
