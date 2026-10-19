import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { paths, useDemoRoleSwitch } from '@/shared/config'

/** 시연 기능이 켜져 있을 때만 그린다. 꺼지면 쇼핑 홈으로 보낸다 (관리자가 끄면 새로고침 없이 바로) */
export function DemoOnly({ children }: { children: ReactNode }) {
  return useDemoRoleSwitch() ? children : <Navigate to={paths.shop.home} replace />
}
