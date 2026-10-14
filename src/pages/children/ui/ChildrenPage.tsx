import { Link } from 'react-router'
import { ChildCard, useChildrenQuery } from '@/entities/child'
import { RegisterChildForm } from '@/features/register-child'
import { getErrorMessage } from '@/shared/api'
import { memberPathsOf } from '@/shared/config'
import { useArea } from '@/shared/lib'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function ChildrenPage() {
  const children = useChildrenQuery()
  const memberPaths = memberPathsOf(useArea())

  return (
    <div className="space-y-4">
      <PageHeader
        title="자녀 프로필"
        step="①"
        description="자녀를 등록하면 상품마다 맞는 사이즈를 추천해 드려요."
        note="자녀를 등록하면 회원이 child.changed 이벤트를 보내고, 추천 · 주문이 각자 복사본을 저장해요."
      />
      <RegisterChildForm />
      <div className="space-y-2">
        <h2 className="font-semibold">내 자녀</h2>
        {children.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {children.isError && (
          <StateMessage tone="error">{getErrorMessage(children.error)}</StateMessage>
        )}
        {children.data?.length === 0 && <StateMessage>등록한 자녀가 없어요.</StateMessage>}
        {children.data?.map((child) => (
          <Link
            key={child.id}
            to={memberPaths.child(child.id)}
            className="block"
            aria-label={`${child.name} 상세`}
          >
            <ChildCard child={child} />
          </Link>
        ))}
      </div>
    </div>
  )
}
