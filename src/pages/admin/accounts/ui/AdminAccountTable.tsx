import { DisableAdminButton } from '@/features/manage-admin-account'
import { ADMIN_STATUS_LABEL, isSignedInAdmin, type AdminAccount } from '@/entities/admin-account'
import { cn, formatDateTime } from '@/shared/lib'

type AdminAccountTableProps = {
  admins: AdminAccount[]
  /** 지금 로그인한 관리자 ID. 모르면 null */
  myAdminId: string | null
}

const HEAD = 'py-2 pr-4 font-medium whitespace-nowrap last:pr-0'
const CELL = 'py-3 pr-4 align-top last:pr-0'

/** 관리자 표: 이메일 · 상태 · 만든 시각, 활성인 다른 관리자는 「비활성화」. 내 계정은 버튼 대신 표시만 */
export function AdminAccountTable({ admins, myAdminId }: AdminAccountTableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-label="관리자" className="w-full text-sm">
        <thead>
          <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
            <th scope="col" className={HEAD}>
              이메일
            </th>
            <th scope="col" className={HEAD}>
              상태
            </th>
            <th scope="col" className={HEAD}>
              만든 시각
            </th>
            <th scope="col" className={HEAD}>
              <span className="sr-only">비활성화</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-rule border-rule divide-y border-b">
          {admins.map((admin) => (
            <tr key={admin.id}>
              <td className={cn(CELL, 'break-all')}>
                <span className="text-ink block font-semibold">{admin.email}</span>
                <span className="text-ink-3 figure block text-xs">관리자 #{admin.id}</span>
              </td>
              <td
                className={cn(
                  CELL,
                  'whitespace-nowrap',
                  admin.status === 'DISABLED' ? 'text-ink-3' : 'text-ink',
                )}
              >
                {ADMIN_STATUS_LABEL[admin.status]}
              </td>
              <td className={cn(CELL, 'figure text-ink-2 whitespace-nowrap')}>
                {formatDateTime(admin.createdAt)}
              </td>
              <td className={CELL}>
                {isSignedInAdmin(admin, myAdminId) ? (
                  <span className="text-ink-3 text-[13px] whitespace-nowrap">내 계정</span>
                ) : (
                  <DisableAdminButton admin={admin} myAdminId={myAdminId} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
