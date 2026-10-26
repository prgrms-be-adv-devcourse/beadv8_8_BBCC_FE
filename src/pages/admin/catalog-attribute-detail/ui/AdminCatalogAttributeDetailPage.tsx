import { Link, useParams } from 'react-router'
import { ATTRIBUTE_INPUT_TYPE_LABEL, hasValueList, useAttributesQuery } from '@/entities/catalog'
import { AddAttributeValueForm } from '@/features/manage-catalog'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 항목 상세: 코드 · 입력 방식 → 목록 값과 「값 더하기」 (목록 값이 있는 항목만) */
export function AdminCatalogAttributeDetailPage() {
  const { attributeId = '' } = useParams()
  // 항목 하나 API가 없어 목록에서 찾는다
  const attributes = useAttributesQuery()
  const attribute = attributes.data?.find((item) => item.id === attributeId)

  return (
    <div className="shop-look max-w-3xl space-y-6">
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
      <PageHeader
        title={attribute?.name ?? '항목'}
        description="이미 만든 코드와 값은 바꾸거나 지울 수 없어요. 목록 값은 더할 수 있어요."
        note="GET /admin/attributes에서 찾고, POST /admin/attributes/{id}/values로 값을 더한다. 같은 이름이면 409"
      />
      {attributes.isPending && <ListSkeleton rows={2} />}
      {attributes.isError && (
        <StateMessage tone="error">{getErrorMessage(attributes.error)}</StateMessage>
      )}
      {attributes.data && !attribute && (
        <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
          없는 항목이에요.
        </p>
      )}
      {attribute && (
        <>
          <dl className="border-rule grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-lg border p-5 text-sm">
            <dt className="text-ink-3">코드</dt>
            <dd className="figure font-semibold">{attribute.code}</dd>
            <dt className="text-ink-3">입력 방식</dt>
            <dd>{ATTRIBUTE_INPUT_TYPE_LABEL[attribute.inputType]}</dd>
          </dl>

          {hasValueList(attribute.inputType) ? (
            <section aria-labelledby="attribute-values" className="space-y-4">
              <h2 id="attribute-values" className="text-section">
                목록 값
                <span className="figure text-ink-3 ml-2 text-sm font-medium">
                  {attribute.values.length}개
                </span>
              </h2>
              {attribute.values.length === 0 ? (
                <StateMessage>목록 값이 없어요.</StateMessage>
              ) : (
                <ul aria-label="목록 값" className="border-rule divide-rule divide-y border-y">
                  {attribute.values.map((value) => (
                    <li key={value.id} className="flex min-h-11 items-center gap-3 py-2 text-sm">
                      {value.colorCode && (
                        <span
                          aria-hidden
                          className="border-rule size-5 shrink-0 rounded-full border"
                          style={{ backgroundColor: value.colorCode }}
                        />
                      )}
                      <span className="font-semibold">{value.name}</span>
                      {value.colorCode && (
                        <span className="figure text-ink-3 ml-auto text-[13px]">
                          {value.colorCode}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="bg-paper-2 space-y-2 rounded-lg p-4">
                <p className="text-sm font-bold">새 목록 값</p>
                <AddAttributeValueForm attributeId={attribute.id} inputType={attribute.inputType} />
              </div>
            </section>
          ) : (
            <p className="bg-paper-2 text-ink-2 rounded-lg p-5 text-sm">
              직접 입력 항목이라 목록 값이 없어요. 판매자가 상품마다 글자로 적어요.
            </p>
          )}
        </>
      )}
    </div>
  )
}
