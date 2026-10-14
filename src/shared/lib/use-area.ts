import { useLocation } from 'react-router'
import { areaOf, type Area } from '@/shared/config'

/** 지금 화면이 속한 영역 (쇼핑 · 판매자 센터 · 관리자 · 시연 콘솔) */
export function useArea(): Area {
  return areaOf(useLocation().pathname)
}
