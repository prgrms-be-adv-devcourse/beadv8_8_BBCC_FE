import { ConnectionCheck } from '@/widgets/connection-check'
import { PageHeader } from '@/shared/ui/PageHeader'

export function ConsoleConnectPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="백엔드 연결 점검"
        description="실제 백엔드에 조회 API를 한 번씩 불러 응답 · 계약 · 시간을 확인해요. 배포 환경에 처음 붙였을 때 시연 전에 돌려요."
      />
      <ConnectionCheck />
    </div>
  )
}
