import { Button } from '@/shared/ui/button'
import { useLogout } from '../model/use-logout'

export function LogoutButton() {
  const logout = useLogout()
  return (
    <Button size="sm" variant="ghost" disabled={logout.isPending} onClick={() => logout.mutate()}>
      로그아웃
    </Button>
  )
}
