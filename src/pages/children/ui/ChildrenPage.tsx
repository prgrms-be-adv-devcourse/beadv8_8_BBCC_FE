import { ChildCard, useChildrenQuery } from '@/entities/child'
import { RegisterChildForm } from '@/features/register-child'
import { getErrorMessage } from '@/shared/api'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function ChildrenPage() {
  const children = useChildrenQuery()

  return (
    <div className="space-y-4">
      <PageHeader
        title="① 자녀 프로필"
        description="자녀를 등록하면 회원이 child.changed 이벤트를 보내고, 추천 · 주문이 각자 복사본을 저장해요."
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
          <ChildCard key={child.id} child={child} />
        ))}
      </div>
    </div>
  )
}
