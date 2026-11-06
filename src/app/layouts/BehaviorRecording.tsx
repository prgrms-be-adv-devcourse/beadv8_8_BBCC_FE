import { useEffect } from 'react'
import { areaOf, env } from '@/shared/config'
import { isClarityStarted, startClarity } from '../providers/clarity'
import { useLocation } from 'react-router'

/**
 * 행동 분석(Clarity)은 쇼핑 영역에서만 녹화한다.
 * 자녀 영역(14세 미만이 직접 쓰는 화면)과 판매자 센터 · 관리자 · 시연 콘솔은 녹화하지 않는다.
 * 스크립트는 한 번 넣으면 뺄 수 없으므로, 녹화 중에 다른 영역으로 넘어가면 새로 불러와 스크립트 없이 연다
 */
export function BehaviorRecording() {
  const { pathname } = useLocation()
  const recordable = areaOf(pathname) === 'shop'

  useEffect(() => {
    if (recordable) startClarity(env.clarityProjectId)
    else if (isClarityStarted()) window.location.reload()
  }, [recordable])

  return null
}
