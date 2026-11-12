import { CreateAdminForm } from '@/features/manage-admin-account'
import { PageHeader } from '@/shared/ui/PageHeader'

/** 관리자 계정: 새 관리자 추가 (관리자 목록 조회 API가 없어 목록은 없다) */
export function AdminAccountsPage() {
  return (
    <div className="shop-look max-w-2xl space-y-6">
      <PageHeader
        title="관리자 계정"
        description="새 관리자 계정을 만들어요. 만든 계정은 바로 로그인할 수 있어요."
      />
      <div className="border-rule rounded-lg border p-5">
        <CreateAdminForm />
      </div>
    </div>
  )
}
