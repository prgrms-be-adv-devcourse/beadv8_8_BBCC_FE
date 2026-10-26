import { Link, NavLink, Outlet } from 'react-router'
import { hasRole, ROLE_LABEL, useSessionStore } from '@/entities/session'
import { paths, useDemoRoleSwitch } from '@/shared/config'
import { cn } from '@/shared/lib'
import { DemoBarWithFlowDrawer } from './DemoBarWithFlowDrawer'
import { TopProgressBar } from './TopProgressBar'
import { SessionGate } from './SessionGate'
import { Overlays } from './Overlays'

type MenuGroup = { title: string; links: { to: string; label: string; end?: boolean }[] }

/** 왼쪽 메뉴: 판매자 센터 메뉴처럼 관심사별 묶음. 상세 · 만들기 화면에서도 그 목록 메뉴가 골라진다 */
const MENU: MenuGroup[] = [
  {
    title: '운영',
    links: [{ to: paths.admin.home, label: '대시보드', end: true }],
  },
  {
    title: '회원',
    links: [
      { to: paths.admin.members, label: '회원 관리' },
      { to: paths.admin.sellerApplications, label: '판매자 신청 심사' },
    ],
  },
  {
    title: '거래',
    links: [
      { to: paths.admin.orders, label: '전체 주문' },
      { to: paths.admin.payments, label: '전체 결제' },
      { to: paths.admin.settlements, label: '정산' },
    ],
  },
  {
    title: '상품',
    links: [
      { to: paths.admin.products, label: '상품 관리' },
      { to: paths.admin.attributes, label: '항목 · 목록 값' },
      { to: paths.admin.measurementItems, label: '실측 항목' },
      { to: paths.admin.productTypes, label: '상품 유형' },
      { to: paths.admin.categories, label: '카테고리' },
    ],
  },
  {
    title: '시스템',
    links: [{ to: paths.admin.settings, label: '설정' }],
  },
]

function AdminMenu({ className }: { className?: string }) {
  return (
    <nav aria-label="관리자 메뉴" className={className}>
      {/* 휴대폰: 본문 위 가로 한 줄 (넘치면 옆으로 민다). 넓은 화면: 묶음 제목이 있는 세로 메뉴 */}
      <div className="flex gap-x-5 overflow-x-auto whitespace-nowrap lg:block lg:space-y-7 lg:overflow-visible">
        {MENU.map((group) => (
          <div key={group.title} className="flex gap-x-5 lg:block lg:space-y-1.5">
            <p className="text-ink-3 text-[13px] font-semibold max-lg:hidden">{group.title}</p>
            <ul className="flex gap-x-5 lg:block">
              {group.links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        'hover:text-ink flex min-h-11 items-center text-[15px] transition-colors lg:min-h-0 lg:py-1.5',
                        isActive ? 'text-ink font-bold' : 'text-ink-2',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}

/** 관리자: 쇼핑 · 판매자 센터와 같은 흰 바탕 · 머리말, 왼쪽 묶음 메뉴(휴대폰은 위) + 업무 화면 */
export function AdminLayout() {
  const user = useSessionStore((state) => state.user)
  const blocked = !hasRole(user, 'ADMIN')
  const demoRoleSwitch = useDemoRoleSwitch()

  return (
    <div className="bg-paper flex min-h-svh flex-col">
      <DemoBarWithFlowDrawer />
      <TopProgressBar />
      {/* 관리자 색 · 글자 (admin.css의 data-area): 시연 막대는 빼고 머리말 · 본문에만 */}
      <div data-area="admin" className="shop-look flex flex-1 flex-col">
        <header className="bg-paper border-rule z-30 border-b md:sticky md:top-0">
          <div className="mx-auto flex h-15 max-w-6xl items-center gap-3 px-4 md:h-17 md:px-6">
            <Link
              to={paths.admin.home}
              aria-label="관리자 홈"
              className="flex min-h-11 shrink-0 items-center gap-2.5"
            >
              <span className="text-signal font-sans text-[28px] leading-none font-black tracking-tight">
                Kidly
              </span>
              <span className="text-ink text-[17px] font-bold">관리자</span>
            </Link>
            <Link
              to={paths.shop.home}
              className="text-ink-2 hover:text-ink ml-auto flex min-h-11 items-center text-[13px] font-semibold transition-colors"
            >
              쇼핑 홈
            </Link>
          </div>
        </header>
        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 content-start items-start gap-6 px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-14">
          <AdminMenu className="border-rule max-lg:-mx-4 max-lg:border-b max-lg:px-4 lg:sticky lg:top-28" />
          <main className="min-w-0">
            <SessionGate>
              {blocked ? (
                <section className="border-rule max-w-xl space-y-2 rounded-lg border p-6">
                  <h1 className="text-section">
                    {ROLE_LABEL.ADMIN} 계정으로 볼 수 있는 화면이에요.
                  </h1>
                  {demoRoleSwitch ? (
                    <p className="text-ink-2 text-[15px]">
                      위의 시연 역할에서 {ROLE_LABEL.ADMIN}를 고르세요.
                    </p>
                  ) : (
                    <p className="text-ink-2 text-[15px]">
                      {ROLE_LABEL.ADMIN} 계정으로{' '}
                      <Link to={paths.login} className="shop-link">
                        로그인
                      </Link>
                      하세요.
                    </p>
                  )}
                </section>
              ) : (
                <Outlet />
              )}
            </SessionGate>
          </main>
        </div>
      </div>
      <Overlays />
    </div>
  )
}
