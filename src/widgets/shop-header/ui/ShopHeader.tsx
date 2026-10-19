import { useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useCartCount } from '@/entities/cart'
import { useSessionStore } from '@/entities/session'
import { loginPath, paths } from '@/shared/config'
import { cn } from '@/shared/lib'

const NAV = [
  { to: paths.shop.home, label: '홈', end: true },
  { to: paths.shop.children, label: 'Fit Passport', end: false, growth: true },
  { to: paths.shop.orders, label: '주문 내역', end: false },
  { to: paths.shop.my, label: '마이페이지', end: true },
]

/** 검색어는 주소(?q=)에 싣는다 → 홈 상품 목록이 읽는다 */
function HeaderSearch() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const current = pathname === paths.shop.home ? (params.get('q') ?? '') : ''
  const [keyword, setKeyword] = useState(current)
  const [synced, setSynced] = useState(current)
  if (synced !== current) {
    setSynced(current)
    setKeyword(current)
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const q = keyword.trim()
    navigate(q ? `${paths.shop.home}?q=${encodeURIComponent(q)}` : paths.shop.home)
  }
  return (
    <form
      role="search"
      onSubmit={submit}
      className="bg-primary-soft/60 focus-within:border-primary order-last flex h-10 min-w-0 basis-full items-center rounded-full border border-transparent pr-1 pl-4 md:order-none md:flex-1 md:basis-auto"
    >
      <input
        aria-label="상품 검색"
        placeholder="우리 아이가 좋아할 옷을 찾아보세요"
        className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <button
        type="submit"
        aria-label="검색"
        className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  )
}

/** 쇼핑 영역 머리말 (E안). API를 부르지 않는다 (흐름 기록을 화면 동작만으로 남기려고) */
export function ShopHeader() {
  const user = useSessionStore((state) => state.user)
  const cartCount = useCartCount()
  const { pathname, search } = useLocation()
  return (
    <header className="bg-background/95 sticky top-0 z-30 border-b backdrop-blur">
      <p className="bg-primary-deep text-primary-foreground px-4 py-1.5 text-center text-xs">
        자녀 프로필을 등록하면 키에 맞는 사이즈만 보여드려요 ·{' '}
        <Link to={paths.shop.children} className="text-highlight font-semibold underline">
          프로필 등록하기
        </Link>
      </p>
      {/* 휴대폰은 검색 칸을 아래 줄로 내려 가로로 넘치지 않게 한다 */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:h-16 md:flex-nowrap md:gap-6 md:px-6 md:py-0">
        <Link
          to={paths.shop.home}
          className="text-primary relative shrink-0 text-2xl font-black tracking-tight md:text-3xl"
        >
          Kidly
          <span aria-hidden className="text-highlight absolute -top-2 left-[0.95em] text-sm">
            ♥
          </span>
        </Link>
        <nav className="hidden gap-4 text-sm whitespace-nowrap lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'hover:text-primary font-medium',
                  item.growth && 'text-growth-deep',
                  isActive && 'text-primary font-bold',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <HeaderSearch />
        <div className="ml-auto flex shrink-0 items-center gap-3 md:ml-0">
          <nav className="flex gap-3 text-sm whitespace-nowrap lg:hidden">
            {NAV.slice(2).map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="hover:text-primary">
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link
            to={paths.shop.cart}
            aria-label={user && cartCount ? `장바구니 ${cartCount}개` : '장바구니'}
            className="hover:text-primary relative flex size-9 items-center justify-center rounded-full"
          >
            {user && cartCount ? (
              <span
                aria-hidden
                className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            ) : null}
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </Link>
          {!user && pathname !== paths.login && (
            <Link
              to={loginPath(pathname + search)}
              className="border-primary text-primary rounded-full border-2 px-4 py-1.5 text-sm font-semibold"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
