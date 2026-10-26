import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useCartCount } from '@/entities/cart'
import { useSessionStore } from '@/entities/session'
import { useLogout } from '@/features/logout'
import { loginPath, paths, shopNeedsLogin } from '@/shared/config'
import { cn } from '@/shared/lib'

/** 검색어는 주소(?q=)에 싣는다 → 홈 상품 목록이 읽는다 */
function HeaderSearch({ className }: { className?: string }) {
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
      className={cn(
        'border-ink bg-paper has-[input:focus-visible]:outline-signal flex h-11 min-w-0 items-center rounded-md border-[1.5px] pr-1 pl-4 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2',
        className,
      )}
    >
      <input
        aria-label="상품 검색"
        placeholder="우리 아이 옷, 상점 이름으로 찾아보세요"
        className="placeholder:text-ink-3 text-ink min-w-0 flex-1 bg-transparent text-[15px] focus-visible:outline-none"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <button
        type="submit"
        aria-label="검색"
        className="text-ink hover:text-signal focus-visible:outline-signal flex size-9 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  )
}

type UtilityLinkProps = {
  to: string
  label: string
  ariaLabel?: string
  /** 개수 표시: 휴대폰은 아이콘 위, 넓은 화면은 글자 뒤 */
  count?: number | null
  children: ReactNode
}

/** 머리말 오른쪽 바로가기: 휴대폰은 아이콘만, 넓은 화면은 아이콘 + 글자 */
function UtilityLink({ to, label, ariaLabel, count, children }: UtilityLinkProps) {
  return (
    <NavLink
      to={to}
      aria-label={ariaLabel ?? label}
      className={({ isActive }) =>
        cn(
          'hover:text-signal relative flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md text-[13px] font-semibold transition-colors active:translate-y-px md:min-w-0 md:px-2',
          isActive ? 'text-signal' : 'text-ink',
        )
      }
    >
      {children}
      <span className="max-md:hidden">{label}</span>
      {count ? (
        <span
          aria-hidden
          className="bg-signal text-signal-ink flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold max-md:absolute max-md:top-1 max-md:right-0.5"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </NavLink>
  )
}

const ACCOUNT_BOX =
  'border-rule text-ink hover:border-ink flex h-8 items-center rounded-md border px-2.5 text-[13px] font-semibold transition-colors'

/** 로그인 · 회원가입(카카오 로그인 한 번으로 가입까지) 또는 로그아웃 */
function AccountAction() {
  const user = useSessionStore((state) => state.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  if (user) {
    const handleLogout = async () => {
      // 로그인해야 보는 화면이면 홈으로 다 옮긴 뒤 로그아웃한다 (먼저 로그아웃하면 로그인 화면으로 튕긴다)
      if (shopNeedsLogin(pathname)) await navigate(paths.shop.home)
      logout.mutate()
    }
    return (
      <button
        type="button"
        disabled={logout.isPending}
        onClick={handleLogout}
        className="ml-1 flex min-h-11 items-center disabled:opacity-50"
      >
        <span className={ACCOUNT_BOX}>로그아웃</span>
      </button>
    )
  }
  if (pathname === paths.login) return null
  return (
    <Link to={loginPath(pathname + search)} className="ml-1 flex min-h-11 items-center">
      <span className={ACCOUNT_BOX}>
        로그인<span className="max-md:hidden">/회원가입</span>
      </span>
    </Link>
  )
}

/**
 * 쇼핑 영역 머리말: 로고와 검색 · 알림 · 마이페이지 · 장바구니 · 로그인 한 줄.
 * 탭 메뉴는 두지 않는다 (홈은 로고, 자녀 프로필 · 주문 내역은 마이페이지 메뉴에 있다).
 * 화면을 열 때 API를 부르지 않는다 (흐름 기록을 화면 동작만으로 남기려고). 로그아웃은 누를 때만 부른다
 */
export function ShopHeader() {
  const user = useSessionStore((state) => state.user)
  const cartCount = useCartCount()
  return (
    // 휴대폰에서는 고정하지 않는다 (머리말이 화면을 덮지 않게)
    <header className="bg-paper border-rule z-30 border-b md:sticky md:top-0">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* 휴대폰은 검색 칸을 아래 줄로 내려 가로로 넘치지 않게 한다 */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 py-3 md:h-17 md:flex-nowrap md:py-0">
          <Link
            to={paths.shop.home}
            className="text-signal shrink-0 font-sans text-[28px] leading-none font-black tracking-tight"
          >
            Kidly
          </Link>
          <HeaderSearch className="order-last basis-full md:order-none md:max-w-xl md:flex-1 md:basis-auto" />
          <div className="ml-auto flex shrink-0 items-center md:gap-1">
            <UtilityLink to={paths.shop.notifications} label="알림">
              <svg
                viewBox="0 0 24 24"
                className="size-6 md:size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
                <path d="M10 20.5a2 2 0 0 0 4 0" />
              </svg>
            </UtilityLink>
            <UtilityLink to={paths.shop.my} label="마이페이지">
              <svg
                viewBox="0 0 24 24"
                className="size-6 md:size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
              </svg>
            </UtilityLink>
            <UtilityLink
              to={paths.shop.cart}
              label="장바구니"
              ariaLabel={user && cartCount ? `장바구니 ${cartCount}개` : '장바구니'}
              count={user ? cartCount : null}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-6 md:size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <path d="M6 8h12l-1 12H7L6 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
            </UtilityLink>
            <AccountAction />
          </div>
        </div>
      </div>
    </header>
  )
}
