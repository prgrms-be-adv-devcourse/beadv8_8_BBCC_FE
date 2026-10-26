import { Link, useNavigate, useParams } from 'react-router'
import {
  ChildCard,
  GrowthChart,
  GrowthRecordList,
  summarizeGrowth,
  useChildQuery,
  useGrowthRecordsQuery,
} from '@/entities/child'
import { DeleteChildButton, EditChildForm, EditGrowthRecord } from '@/features/edit-child'
import { getErrorMessage } from '@/shared/api'
import { memberPathsOf } from '@/shared/config'
import { useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 자녀 상세 · 수정 · 삭제 · 성장 이력 */
export function ShopChildDetailPage() {
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
    <div className="shop-look space-y-6">
      <Link
        to={memberPaths.children}
        className="text-ink-3 hover:text-ink inline-flex items-center gap-1 rounded-md text-[13px] font-semibold transition-colors"
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
        자녀 프로필
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
      {/* 넓은 화면: 왼쪽 자녀 카드 · 성장 이력, 오른쪽 정보 수정 */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="space-y-6">
          <ChildCard child={child.data} />
          <section
            aria-label="성장 이력"
            className="border-rule space-y-4 rounded-lg border p-4 md:p-5"
          >
            <h2 className="text-section">성장 이력</h2>
            {growth.isPending && <StateMessage>불러오는 중…</StateMessage>}
            {growth.isError && (
              <StateMessage tone="error">{getErrorMessage(growth.error)}</StateMessage>
            )}
            {growth.data && (
              <GrowthChart records={growth.data} currentHeightCm={child.data.heightCm} />
            )}
            {growth.data && (
              <GrowthRecordList
                records={growth.data}
                summary={summarizeGrowth(growth.data)}
                action={(record) => <EditGrowthRecord childId={child.data.id} record={record} />}
              />
            )}
          </section>
        </div>
        <div className="lg:sticky lg:top-32">
          <EditChildForm key={child.data.id} child={child.data} />
        </div>
      </div>
    </div>
  )
}
