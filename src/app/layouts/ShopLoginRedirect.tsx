import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSessionStore } from '@/entities/session'
import { loginPath, shopNeedsLogin } from '@/shared/config'

type ShopLoginRedirectProps = { children: ReactNode }

/** 로그인이 필요한 쇼핑 화면(장바구니 · 주문 · 마이페이지)에 로그인 없이 오면 로그인 화면으로 (돌아올 주소 포함) */
export function ShopLoginRedirect({ children }: ShopLoginRedirectProps) {
  const { pathname, search } = useLocation()
  const user = useSessionStore((state) => state.user)
  if (!user && shopNeedsLogin(pathname)) {
    return <Navigate to={loginPath(pathname + search)} replace />
  }
  return children
}
