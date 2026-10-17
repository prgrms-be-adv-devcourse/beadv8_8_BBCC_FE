import { useEffect } from 'react'
import { useBlocker } from 'react-router'
import { confirmAction } from './confirm'

/**
 * 입력 중인 폼을 두고 나가려 하면 확인한다 (다른 화면으로 이동 · 새로고침 · 탭 닫기).
 * 같은 화면 안에서 주소만 바뀌는 것(?q= 등)은 막지 않는다
 */
export function useLeaveGuard(when: boolean, message = '입력한 내용이 저장되지 않았어요.') {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    void confirmAction({
      title: '이 화면을 나갈까요?',
      description: message,
      confirmLabel: '나가기',
      tone: 'danger',
    }).then((ok) => (ok ? blocker.proceed() : blocker.reset()))
  }, [blocker, message])

  useEffect(() => {
    if (!when) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [when])
}
