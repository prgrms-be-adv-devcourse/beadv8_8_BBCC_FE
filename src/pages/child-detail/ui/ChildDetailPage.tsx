import { Link, useNavigate, useParams } from 'react-router'
import {
  ChildCard,
  GrowthRecordList,
  summarizeGrowth,
  useChildQuery,
  useGrowthRecordsQuery,
} from '@/entities/child'
import { DeleteChildButton, EditChildForm, EditGrowthRecord } from '@/features/edit-child'
import { getErrorMessage } from '@/shared/api'
import { memberPathsOf } from '@/shared/config'
import { useArea } from '@/shared/lib'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

/** 자녀 상세 · 수정 · 삭제 · 성장 이력 */
export function ChildDetailPage() {
  const { childId = '' } = useParams()
  const navigate = useNavigate()
  const memberPaths = memberPathsOf(useArea())
  const child = useChildQuery(childId)
  const growth = useGrowthRecordsQuery(childId)

  if (child.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (child.isError)
    return (
      <div className="space-y-2">
        <StateMessage tone="error">{getErrorMessage(child.error)}</StateMessage>
        <Link to={memberPaths.children} className="text-primary text-sm underline">
          자녀 목록으로
        </Link>
      </div>
    )

  return (
    <div className="space-y-4">
      <Link to={memberPaths.children} className="text-muted-foreground text-sm hover:underline">
        ← 자녀 목록
      </Link>
      <PageHeader
        title={`${child.data.name} 프로필`}
        step="①"
        description="키 · 체형이 바뀌면 성장 이력에 쌓이고, 사이즈 추천에 바로 반영돼요."
        note="수정 · 삭제하면 회원이 child.changed를 보내 추천 · 주문 복사본이 바뀌어요 (삭제는 deleted = true)."
        actions={
          <DeleteChildButton
            childId={child.data.id}
            childName={child.data.name}
            onDeleted={() => navigate(memberPaths.children, { replace: true })}
          />
        }
      />
      <ChildCard child={child.data} />
      <EditChildForm key={child.data.id} child={child.data} />
      <Card className="space-y-2">
        <CardTitle>성장 이력</CardTitle>
        {growth.isPending && <StateMessage>불러오는 중…</StateMessage>}
        {growth.isError && (
          <StateMessage tone="error">{getErrorMessage(growth.error)}</StateMessage>
        )}
        {growth.data && (
          <GrowthRecordList
            records={growth.data}
            summary={summarizeGrowth(growth.data)}
            action={(record) => <EditGrowthRecord childId={child.data.id} record={record} />}
          />
        )}
      </Card>
    </div>
  )
}
