import { APPLICATION_STATUS_LABEL, useSellerApplicationsQuery } from '@/entities/seller'
import { ApproveSellerButton } from '@/features/approve-seller'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

export function AdminSellerApplicationsPage() {
  const applications = useSellerApplicationsQuery(null)

  return (
    <div className="space-y-4">
      <PageHeader
        title="② 판매자 신청 심사 (관리자)"
        description="승인하면 신청한 회원이 다음 토큰부터 SELLER 역할을 받아요."
      />
      {applications.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {applications.isError && (
        <StateMessage tone="error">{getErrorMessage(applications.error)}</StateMessage>
      )}
      {applications.data?.content.length === 0 && <StateMessage>신청이 없어요.</StateMessage>}
      {applications.data?.content.map((application) => (
        <Card key={application.id} className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {application.businessName}{' '}
              <Badge>{APPLICATION_STATUS_LABEL[application.status]}</Badge>
            </p>
            <p className="text-muted-foreground text-sm">
              신청자 {application.applicantNickname}(회원 {application.applicantId}) ·{' '}
              {application.maskedBusinessRegistrationNumber} ·{' '}
              {formatDateTime(application.createdAt)}
            </p>
          </div>
          {application.status === 'PENDING' && (
            <ApproveSellerButton applicationId={application.id} />
          )}
        </Card>
      ))}
    </div>
  )
}
