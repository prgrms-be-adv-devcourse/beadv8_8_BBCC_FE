import { Link } from 'react-router'
import {
  ATTRIBUTE_ROLE_LABEL,
  useProductTypesQuery,
  type ProductTypeLink,
} from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 연결 하나의 설정을 한 줄 글로 (예: 옵션 · 필수 · 사이즈 역할 · 허용 값 2개) */
function linkSummary(link: ProductTypeLink): string {
  return [
    ATTRIBUTE_ROLE_LABEL[link.role],
    link.required ? '필수' : '선택',
    link.sizeRole && '사이즈 역할',
    link.priceAffecting && '가격 구분',
    link.inputType !== 'TEXT' &&
      (link.allValuesAllowed
        ? '모든 값 허용'
        : `허용 값 ${link.allowedValues.map((value) => value.name).join(', ')}`),
  ]
    .filter(Boolean)
    .join(' · ')
}

/** 상품 유형(목록): 제목 줄의 「상품 유형 만들기」, 유형마다 연결한 항목과 그 설정 */
export function AdminCatalogProductTypesPage() {
  const types = useProductTypesQuery()

  return (
    <div className="shop-look space-y-6">
      <PageHeader
        title="상품 유형"
        description="유형마다 상품 등록 화면에 나올 항목과 그 역할(옵션 · 정보)을 정해요. 말단 카테고리는 유형 하나를 써요."
        note="GET · POST /admin/product-types. 유형 규칙(필수 옵션 · 사이즈 역할 하나 · 옵션은 팔레트 · 목록만)은 화면에서 먼저 막는다"
        actions={
          <Link
            to={paths.admin.productTypeNew}
            className="shop-btn min-h-10 shrink-0 px-4 text-sm max-lg:min-h-11"
          >
            상품 유형 만들기
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-section">
          상품 유형
          {types.data && (
            <span className="figure text-ink-3 ml-2 text-sm font-medium">
              {types.data.length}개
            </span>
          )}
        </h2>
        {types.isPending && <ListSkeleton />}
        {types.isError && <StateMessage tone="error">{getErrorMessage(types.error)}</StateMessage>}
        {types.data?.length === 0 && <StateMessage>상품 유형이 없어요.</StateMessage>}
        {types.data && types.data.length > 0 && (
          <table aria-label="상품 유형" className="w-full text-sm max-md:block">
            <thead className="max-md:sr-only">
              <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
                <th scope="col" className="w-40 py-2 pr-4 font-medium">
                  유형 이름
                </th>
                <th scope="col" className="py-2 font-medium">
                  연결한 항목
                </th>
              </tr>
            </thead>
            <tbody className="max-md:block">
              {types.data.map((type) => (
                <tr
                  key={type.id}
                  className="border-rule border-b max-md:flex max-md:flex-col max-md:gap-2 max-md:py-3"
                >
                  <td className="py-3 pr-4 align-top font-semibold max-md:p-0">{type.name}</td>
                  <td className="py-3 align-top max-md:p-0">
                    <ul className="space-y-1">
                      {type.links.map((link) => (
                        <li key={link.attributeId} className="flex flex-wrap gap-x-2">
                          <span
                            className={
                              link.role === 'OPTION' ? 'text-signal font-semibold' : 'font-semibold'
                            }
                          >
                            {link.name}
                          </span>
                          <span className="text-ink-3">{linkSummary(link)}</span>
                        </li>
                      ))}
                    </ul>
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
