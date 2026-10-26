import { Link } from 'react-router'
import { ChildCard, useChildrenQuery } from '@/entities/child'
import { getErrorMessage } from '@/shared/api'
import { memberPathsOf } from '@/shared/config'
import { useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

export function ShopChildrenPage() {
  const children = useChildrenQuery()
  const memberPaths = memberPathsOf(useArea())

  return (
    <div className="shop-look space-y-8">
      <PageHeader
        title="자녀 프로필"
        step="①"
        description="자녀를 등록하면 상품마다 맞는 사이즈를 추천해 드려요."
        note="자녀를 등록하면 회원이 child.changed 이벤트를 보내고, 추천 · 주문이 각자 복사본을 저장해요."
        actions={
          <Link
            to={memberPaths.childNew}
            className="bg-signal text-signal-ink hover:bg-signal-deep inline-flex h-9 items-center gap-1 rounded-full px-4 text-[13px] font-semibold transition-colors active:translate-y-px"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            자녀 추가
          </Link>
        }
      />

      <section aria-label="내 자녀" className="space-y-5">
        {children.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {children.isError && (
          <StateMessage tone="error">{getErrorMessage(children.error)}</StateMessage>
        )}
        {children.data?.length === 0 && (
          <div className="border-rule space-y-3 rounded-lg border border-dashed px-6 py-14 text-center">
            <p className="text-ink-2 text-sm">
              아직 등록한 자녀가 없어요. 키만 알려 주시면 맞는 사이즈를 골라 드려요.
            </p>
            <Link to={memberPaths.childNew} className="shop-btn h-11 min-h-0 px-5 text-sm">
              첫 아이 등록하기
            </Link>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {children.data?.map((child) => (
            <Link
              key={child.id}
              to={memberPaths.child(child.id)}
              className="hover:[&>article]:border-ink-3 block rounded-lg [&>article]:transition-colors"
              aria-label={`${child.name} 상세`}
            >
              <ChildCard child={child} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
