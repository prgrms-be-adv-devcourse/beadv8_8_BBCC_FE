import { Link, NavLink } from 'react-router'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'

const NAV = [
  { to: paths.shop.home, label: '홈', end: true },
  { to: paths.shop.orders, label: '주문 내역', end: false },
  { to: paths.shop.my, label: '마이페이지', end: false },
  { to: paths.shop.cart, label: '장바구니', end: false },
]

/** 쇼핑 영역 머리말. API를 부르지 않는다 (흐름 기록을 화면 동작만으로 남기려고) */
export function ShopHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
        <Link to={paths.shop.home} className="text-primary text-2xl font-extrabold tracking-tight">
          Kidly
        </Link>
        <span className="text-muted-foreground hidden text-sm md:inline">
          우리 아이에게 맞는 사이즈를 알려 주는 키즈 패션 마켓
        </span>
        <nav className="ml-auto flex gap-5 text-sm">
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
        </nav>
      </div>
    </header>
  )
}
