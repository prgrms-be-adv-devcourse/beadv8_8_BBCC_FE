import { ApplicationStatusBadge, canApprove, useSellerApplicationsQuery } from '@/entities/seller'
import { ApproveSellerButton } from '@/features/approve-seller'
import { RejectSellerForm } from '@/features/reject-seller'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function AdminSellerApplicationsPage() {
  const applications = useSellerApplicationsQuery(null)

  return (
    <div className="space-y-4">
      <PageHeader
        title="판매자 신청 심사"
        step="②"
        note="승인하면 신청한 회원이 다음 토큰부터 SELLER 역할을 받아요."
      />
      {applications.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {applications.isError && (
        <StateMessage tone="error">{getErrorMessage(applications.error)}</StateMessage>
      )}
      {applications.data?.content.length === 0 && <StateMessage>신청이 없어요.</StateMessage>}
      {applications.data?.content.map((application) => (
        <Card key={application.id} className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">
              {application.businessName} <ApplicationStatusBadge status={application.status} />
            </p>
            <p className="text-muted-foreground text-sm">
              신청자 {application.applicantNickname}(회원 {application.applicantId}) ·{' '}
              {application.maskedBusinessRegistrationNumber} ·{' '}
              {formatDateTime(application.createdAt)}
            </p>
          </div>
          {canApprove(application) && (
            <div className="flex items-start gap-2">
              <ApproveSellerButton applicationId={application.id} />
              <RejectSellerForm applicationId={application.id} />
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
