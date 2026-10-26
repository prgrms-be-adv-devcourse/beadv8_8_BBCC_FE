import type { ReactNode } from 'react'
import {
  APPLICATION_STATUS_LABEL,
  canReapply,
  useMySellerApplicationQuery,
  type SellerApplicationStatus,
} from '@/entities/seller'
import { ApplySellerForm, RefreshSellerRoleButton } from '@/features/apply-seller'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/**
 * 판매자 신청: 내 신청 상태 묶음(상호 · 상태 · 대표 · 사업자번호 · 신청 시각, 거절 사유)이 맨 위,
 * 승인됐으면 역할 받기가 다음 할 일. 다시 신청할 수 있으면 그 아래 신청서
 */
/** 상태 글 색: 승인만 자두, 거절은 오류색, 심사 중은 회색 꼬리표 */
const STATUS_TONE: Record<SellerApplicationStatus, string> = {
  PENDING: 'bg-paper-2 text-ink-2',
  APPROVED: 'bg-signal-soft text-signal',
  REJECTED: 'bg-paper-2 text-destructive',
}

export function CenterApplyPage() {
  const application = useMySellerApplicationQuery()

  return (
    <div className="shop-look max-w-2xl space-y-8">
      <PageHeader
        title="판매자 신청"
        step="②"
        description="관리자가 승인하면 판매자 센터를 쓸 수 있어요."
        note="신청 → 관리자 승인 → 토큰 재발급으로 판매자 역할이 반영돼요."
      />
      {application.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {application.isError && (
        <StateMessage tone="error">{getErrorMessage(application.error)}</StateMessage>
      )}
      {application.data && (
        <section aria-label="내 신청" className="border-rule rounded-lg border">
          <dl>
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 md:p-6">
              <div className="min-w-0">
                <dt className="sr-only">상호</dt>
                <dd className="text-section text-ink break-all">{application.data.businessName}</dd>
              </div>
              <div>
                <dt className="sr-only">상태</dt>
                <dd
                  className={`rounded-md px-2 py-1 text-[13px] font-semibold ${STATUS_TONE[application.data.status]}`}
                >
                  {APPLICATION_STATUS_LABEL[application.data.status]}
                </dd>
              </div>
            </div>
            <div className="border-rule grid gap-4 border-t px-5 py-4 sm:grid-cols-3 md:px-6">
              <DetailItem label="대표">{application.data.representativeName}</DetailItem>
              <DetailItem label="사업자번호">
                <span className="figure">{application.data.maskedBusinessRegistrationNumber}</span>
              </DetailItem>
              <DetailItem label="신청 시각">
                <span className="figure">{formatDateTime(application.data.createdAt)}</span>
              </DetailItem>
            </div>
          </dl>
          {application.data.rejectReason && (
            <p className="border-rule text-destructive border-t px-5 py-4 text-sm font-semibold break-all md:px-6">
              거절 사유: {application.data.rejectReason}
            </p>
          )}
          {application.data.status === 'APPROVED' && (
            <div className="border-rule border-t px-5 py-4 md:px-6">
              <RefreshSellerRoleButton />
            </div>
          )}
        </section>
      )}
      {application.isSuccess && canReapply(application.data) && (
        <section aria-label="신청서" className="border-rule space-y-4 rounded-lg border p-5 md:p-6">
          {application.data && <h2 className="text-section">다시 신청하기</h2>}
          <ApplySellerForm />
        </section>
      )}
    </div>
  )
}

type DetailItemProps = { label: string; children: ReactNode }

function DetailItem({ label, children }: DetailItemProps) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-ink-3 text-[13px]">{label}</dt>
      <dd className="text-ink text-sm font-semibold break-all">{children}</dd>
    </div>
  )
}
