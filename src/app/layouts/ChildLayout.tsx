import { Link, Outlet } from 'react-router'
import { useChildSessionStore } from '@/entities/session'
import { useChildLogout } from '@/features/logout'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { ChildGate } from './ChildGate'
import { DemoBarWithFlowDrawer } from './DemoBarWithFlowDrawer'
import { BehaviorRecording } from './BehaviorRecording'
import { Overlays } from './Overlays'

export function ChildLayout() {
  const accessToken = useChildSessionStore((state) => state.accessToken)
  const logout = useChildLogout()
  return (
    <div className="bg-paper min-h-svh">
      <DemoBarWithFlowDrawer />
      <div data-area="shop" className="shop-look">
        <header className="border-rule flex items-center gap-4 border-b p-4">
          <Link to={paths.child.home} className="text-section">
            Kidly
          </Link>
          <Link to={paths.child.home} className="ml-auto">
            내 프로필
          </Link>
          <Link to={paths.child.products}>상품</Link>
          <Link to={paths.child.cart}>내 장바구니</Link>
          <Link to={paths.child.wishes}>내 조르기</Link>
          <Link to={paths.child.purchases}>나를 위해 산 것</Link>
          <Link to={paths.child.notifications}>알림</Link>
          {accessToken && (
            <Button variant="ghost" disabled={logout.isPending} onClick={() => logout.mutate()}>
              로그아웃
            </Button>
          )}
        </header>
        <main className="mx-auto max-w-6xl p-6">
          <ChildGate>
            <Outlet />
          </ChildGate>
        </main>
      </div>
      <Overlays />
      <BehaviorRecording />
    </div>
  )
}
