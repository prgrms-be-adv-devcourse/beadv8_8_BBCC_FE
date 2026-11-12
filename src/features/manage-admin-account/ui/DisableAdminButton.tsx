import { canDisableAdmin, type AdminAccount } from '@/entities/admin-account'
import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { useDisableAdmin } from '../model/use-manage-admin-account'

type DisableAdminButtonProps = {
  admin: AdminAccount
  /** 지금 로그인한 관리자 ID. 모르면 null (자기 자신이면 서버가 409로 막는다) */
  myAdminId: string | null
}

/** 관리자 비활성화: 활성인 다른 관리자에만 보인다. 확인 창을 거치고, 요청 중에는 막는다 */
export function DisableAdminButton({ admin, myAdminId }: DisableAdminButtonProps) {
  const disable = useDisableAdmin()
  if (!canDisableAdmin(admin, myAdminId)) return null

  const handleDisable = async () => {
    const confirmed = await confirmAction({
      title: '관리자를 비활성화할까요?',
      description: `${admin.email} 계정은 바로 로그인할 수 없게 돼요. 다시 활성화할 수는 없어요.`,
      confirmLabel: '비활성화',
      tone: 'danger',
    })
    if (confirmed) disable.mutate(admin.id)
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        className="text-ink-2 hover:text-ink inline-flex min-h-11 items-center text-[13px] font-semibold underline underline-offset-4 transition-colors disabled:opacity-50 lg:min-h-8"
        disabled={disable.isPending}
        aria-busy={disable.isPending}
        onClick={handleDisable}
      >
        비활성화
      </button>
      {disable.isError && (
        <p role="alert" className="text-destructive text-xs">
          {getErrorMessage(disable.error)}
        </p>
      )}
    </div>
  )
}
