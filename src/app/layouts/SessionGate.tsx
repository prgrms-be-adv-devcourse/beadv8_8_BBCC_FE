import type { ReactNode } from 'react'
import { useSessionStore } from '@/entities/session'

type SessionGateProps = { children: ReactNode }

/** 세션 복원(재발급) 전에 화면이 토큰 없이 조회하지 않도록 기다린다 */
export function SessionGate({ children }: SessionGateProps) {
  const status = useSessionStore((state) => state.status)
  return status === 'ready' ? (
    children
  ) : (
    <p className="text-muted-foreground text-sm">로그인 확인 중…</p>
  )
}
