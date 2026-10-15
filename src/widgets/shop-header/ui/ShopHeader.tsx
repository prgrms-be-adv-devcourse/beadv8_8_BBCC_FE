import { Link, NavLink, useLocation } from 'react-router'
import { useSessionStore } from '@/entities/session'
import { loginPath, paths } from '@/shared/config'
import { cn } from '@/shared/lib'

const NAV = [
  { to: paths.shop.home, label: '홈', end: true },
  { to: paths.shop.orders, label: '주문 내역', end: false },
  { to: paths.shop.my, label: '마이페이지', end: false },
  { to: paths.shop.cart, label: '장바구니', end: false },
]

/** 쇼핑 영역 머리말. API를 부르지 않는다 (흐름 기록을 화면 동작만으로 남기려고) */
export function ShopHeader() {
  const user = useSessionStore((state) => state.user)
  const { pathname, search } = useLocation()
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:h-16 md:gap-8 md:px-6">
        <Link
          to={paths.shop.home}
          className="text-primary shrink-0 text-xl font-extrabold tracking-tight md:text-2xl"
        >
          Kidly
        </Link>
        <span className="text-muted-foreground hidden text-sm lg:inline">
          우리 아이에게 맞는 사이즈를 알려 주는 키즈 패션 마켓
        </span>
        <nav className="ml-auto flex gap-3 overflow-x-auto text-sm whitespace-nowrap md:gap-5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn('hover:text-primary', isActive && 'text-primary font-semibold')
              }
            >
              {item.label}
            </NavLink>
          ))}
          {!user && pathname !== paths.login && (
            <Link to={loginPath(pathname + search)} className="text-primary font-semibold">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
