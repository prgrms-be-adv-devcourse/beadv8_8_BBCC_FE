import type { ReactNode } from 'react'
import { useSessionStore } from '@/entities/session'

/** 세션 복원(재발급) 전에 화면이 토큰 없이 조회하지 않도록 기다린다 */
export function SessionGate({ children }: { children: ReactNode }) {
  const status = useSessionStore((state) => state.status)
  return status === 'ready' ? (
    children
  ) : (
    <p className="text-muted-foreground text-sm">로그인 확인 중…</p>
  )
}

/** 첫 화면을 불러오는 동안 (lazy 화면의 HydrateFallback) */
export function RouteFallback() {
  return <p className="text-muted-foreground p-6 text-sm">불러오는 중…</p>
}
