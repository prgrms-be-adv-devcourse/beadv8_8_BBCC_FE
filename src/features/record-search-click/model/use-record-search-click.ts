import { useSessionStore } from '@/entities/session'
import { runWithAction } from '@/shared/api'
import { recordSearchClick } from '../api/record-search-click-api'
import { toSearchClickRequest, type SearchClick } from './search-click.mapper'

/**
 * 검색 결과에서 상품을 누르면 기록한다 (검색보다 강한 관심 신호). 로그인 회원만 보내고(비로그인은 401),
 * 실패해도 화면에는 알리지 않는다. 상품 상세로 가는 이동은 막지 않는다
 */
export function useRecordSearchClick(): (click: SearchClick) => void {
  const isSignedIn = useSessionStore((state) => state.user !== null)
  return (click) => {
    const request = toSearchClickRequest(click)
    if (!isSignedIn || !request) return
    runWithAction('검색 결과 클릭', () => recordSearchClick(request)).catch(() => undefined)
  }
}
