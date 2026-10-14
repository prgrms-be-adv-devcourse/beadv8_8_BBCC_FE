import { VerificationChecklist } from '@/widgets/verification-checklist'
import { PageHeader } from '@/shared/ui/page-header'

export function VerifyPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="정상 흐름 확인"
        description="기획서 7장 완료 기준을 API 호출 결과로 자동 판정해요. 화면을 오가며 진행하면 오른쪽 기록을 보고 통과 · 실패를 채워요. '목'은 실제 백엔드로 다시 확인해야 해요."
      />
      <VerificationChecklist />
    </div>
  )
}
