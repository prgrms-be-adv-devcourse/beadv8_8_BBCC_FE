import { Link, Outlet, useLocation } from 'react-router'
import { hasRole, ROLE_LABEL, useSessionStore, type Role } from '@/entities/session'
import { useArea } from '@/shared/lib'
import { Card } from '@/shared/ui/card'
import { SideNav, type SideNavItem } from '@/shared/ui/SideNav'
import { DemoBarWithFlowDrawer } from './DemoBarWithFlowDrawer'
import { SessionGate } from './SessionGate'

type WorkspaceLayoutProps = {
  title: string
  items: SideNavItem[]
  /** 이 영역을 쓰는 역할 */
  role: Role
  /** 역할이 없어도 열 수 있는 화면 (예: 판매자 신청) */
  openPaths?: string[]
  /** 역할이 없을 때 안내 링크 */
  guide?: { to: string; label: string }
}

/** 판매자 센터 · 관리자: 왼쪽 메뉴 + 업무 화면 */
export function WorkspaceLayout({
  title,
  items,
  role,
  openPaths = [],
  guide,
}: WorkspaceLayoutProps) {
  const user = useSessionStore((state) => state.user)
  const { pathname } = useLocation()
  const blocked = !hasRole(user, role) && !openPaths.includes(pathname)
  // 영역 색(index.css의 data-area): 시연 막대 · 흐름 서랍은 빼고 메뉴와 본문에만
  const area = useArea()

  return (
    <div className="flex h-svh flex-col">
      <DemoBarWithFlowDrawer />
      <div data-area={area} className="flex min-h-0 flex-1">
        <SideNav title={title} items={items} tone={area === 'admin' ? 'dark' : 'light'} />
        <main className="bg-muted/30 flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-4xl">
            <SessionGate>
              {blocked ? (
                <Card className="space-y-2">
                  <p className="font-semibold">
                    {ROLE_LABEL[role]} 계정으로 볼 수 있는 화면이에요.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    위의 시연 역할에서 {ROLE_LABEL[role]}를 고르세요.
                  </p>
                  {guide && (
                    <Link to={guide.to} className="text-primary text-sm underline">
                      {guide.label}
                    </Link>
                  )}
                </Card>
              ) : (
                <Outlet />
              )}
            </SessionGate>
          </div>
        </main>
      </div>
    </div>
  )
}
