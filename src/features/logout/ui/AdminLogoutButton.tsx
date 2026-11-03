import { Button } from '@/shared/ui/button'
import { useAdminLogout } from '../model/use-logout'

export function AdminLogoutButton() {
  const logout = useAdminLogout()
  return (
    <Button size="sm" variant="ghost" disabled={logout.isPending} onClick={() => logout.mutate()}>
      관리자 로그아웃
    </Button>
  )
}
