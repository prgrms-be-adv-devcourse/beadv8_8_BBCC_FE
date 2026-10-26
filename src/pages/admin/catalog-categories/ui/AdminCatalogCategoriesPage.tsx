import { Link } from 'react-router'
import { categoryTree, useCatalogCategoriesQuery } from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 카테고리(목록): 제목 줄의 「카테고리 만들기」, 깊이만큼 들여 쓴 트리 표 (말단 · 중간, 유형, 실측 항목) */
export function AdminCatalogCategoriesPage() {
  const categories = useCatalogCategoriesQuery()

  return (
    <div className="shop-look space-y-6">
      <PageHeader
        title="카테고리"
        description="상품은 말단 카테고리에만 등록해요. 말단 카테고리는 상품 유형 하나와 필수 실측 항목을 가져요."
        note="GET · POST /admin/categories. 목록은 평면 배열이라 parentId로 트리를 만든다"
        actions={
          <Link
            to={paths.admin.categoryNew}
            className="shop-btn min-h-10 shrink-0 px-4 text-sm max-lg:min-h-11"
          >
            카테고리 만들기
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-section">
          카테고리
          {categories.data && (
            <span className="figure text-ink-3 ml-2 text-sm font-medium">
              {categories.data.length}개
            </span>
          )}
        </h2>
        {categories.isPending && <ListSkeleton />}
        {categories.isError && (
          <StateMessage tone="error">{getErrorMessage(categories.error)}</StateMessage>
        )}
        {categories.data?.length === 0 && <StateMessage>카테고리가 없어요.</StateMessage>}
        {categories.data && categories.data.length > 0 && (
          <table aria-label="카테고리" className="w-full text-sm max-md:block">
            <thead className="max-md:sr-only">
              <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
                <th scope="col" className="py-2 pr-4 font-medium">
                  카테고리
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  종류
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  상품 유형
                </th>
                <th scope="col" className="py-2 font-medium">
                  필수 실측 항목
                </th>
              </tr>
            </thead>
            <tbody className="max-md:block">
              {categoryTree(categories.data).map(({ category, depth }) => (
                <tr
                  key={category.id}
                  className="border-rule border-b max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:gap-y-1 max-md:py-3"
                >
                  <td
                    className="py-3 pr-4 align-middle max-md:w-full max-md:p-0"
                    style={{ paddingLeft: `${depth * 1.25}rem` }}
                  >
                    <span className={depth === 0 ? 'font-bold' : 'font-semibold'}>
                      {depth > 0 && '└ '}
                      {category.name}
                    </span>
                  </td>
                  <td className="py-3 pr-4 align-middle max-md:p-0">
                    <span
                      className={`inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap ${
                        category.isLeaf ? 'bg-signal-soft text-signal' : 'bg-paper-2 text-ink-2'
                      }`}
                    >
                      {category.isLeaf ? '말단' : '중간'}
                    </span>
                  </td>
                  <td className="text-ink-2 py-3 pr-4 align-middle max-md:p-0">
                    {category.productTypeName && (
                      <>
                        <span className="text-ink-3 mr-1 text-[13px] md:hidden">유형</span>
                        {category.productTypeName}
                      </>
                    )}
                  </td>
                  <td className="text-ink-2 py-3 align-middle max-md:p-0">
                    {category.measurementItems.length > 0 && (
                      <>
                        <span className="text-ink-3 mr-1 text-[13px] md:hidden">실측</span>
                        {category.measurementItems.map((item) => item.name).join(' · ')}
                      </>
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
