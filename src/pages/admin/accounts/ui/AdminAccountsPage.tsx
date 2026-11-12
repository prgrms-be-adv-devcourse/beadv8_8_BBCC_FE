import { useState } from 'react'
import { CreateAdminForm } from '@/features/manage-admin-account'
import { useAdminAccountsQuery } from '@/entities/admin-account'
import { useMyAdminId } from '@/entities/session'
import { getErrorMessage } from '@/shared/api'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { AdminAccountTable } from './AdminAccountTable'

/** 관리자 계정: 새 관리자 추가 · 관리자 목록에서 비활성화 */
export function AdminAccountsPage() {
  const [page, setPage] = useState(0)
  const admins = useAdminAccountsQuery(page)
  const myAdminId = useMyAdminId()
  const rows = admins.data?.content ?? []

  return (
    <div className="shop-look max-w-2xl space-y-8">
      <PageHeader
        title="관리자 계정"
        description="새 관리자 계정을 만들고, 더 쓰지 않는 계정은 비활성화해요. 만든 계정은 바로 로그인할 수 있어요."
      />
      <div className="border-rule rounded-lg border p-5">
        <CreateAdminForm />
      </div>
      <section aria-label="관리자 목록" className="space-y-3">
        <h2 className="text-section">
          관리자
          {admins.data && (
            <span className="figure text-ink-3 ml-2 text-sm font-medium">
              {admins.data.totalElements}명
            </span>
          )}
        </h2>
        {admins.isPending && <ListSkeleton />}
        {admins.isError && (
          <StateMessage tone="error">{getErrorMessage(admins.error)}</StateMessage>
        )}
        {rows.length > 0 && <AdminAccountTable admins={rows} myAdminId={myAdminId} />}
        {admins.data && (
          <Pagination
            page={admins.data.page}
            totalPages={admins.data.totalPages}
            onChange={setPage}
          />
        )}
      </section>
    </div>
  )
}
