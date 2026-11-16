import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

/**
 * 다른 화면으로 가면 맨 위부터 보여 준다 (앞 화면에서 내린 자리가 남지 않게).
 * 뒤로 · 앞으로 가기는 브라우저가 기억한 자리를 그대로 두고,
 * 같은 화면에서 주소의 물음표 뒤만 바뀔 때(거르기 · 탭 · 페이지)와 `#자리`로 갈 때는 옮기지 않는다
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  const shownPathname = useRef(pathname)
  useEffect(() => {
    if (shownPathname.current === pathname) return
    shownPathname.current = pathname
    if (navigationType === 'POP' || hash) return
    window.scrollTo(0, 0)
  }, [pathname, hash, navigationType])
  return null
}
