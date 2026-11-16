import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { notificationKeys } from '@/entities/notification'
import { useSessionStore } from '@/entities/session'
import { runWithAction } from '@/shared/api'
import { env } from '@/shared/config'
import {
  enableWebPush,
  isWebPushAvailable,
  readPushPermission,
  startWebPushSession,
} from './web-push'
import { isWebPushConfigured, toWebPushStatus } from './web-push.rules'

/** 「알림 받기」 버튼: 상태 (끔 · 확인 중 · 지원 안 함 · 막힘 · 묻기 전 · 받는 중) 와 권한 요청 */
export function useWebPush() {
  const isConfigured = isWebPushConfigured(env.firebase)
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [permission, setPermission] = useState(readPushPermission)

  useEffect(() => {
    if (!isConfigured) return
    let isActive = true
    void isWebPushAvailable().then((available) => {
      if (isActive) setIsSupported(available)
    })
    return () => {
      isActive = false
    }
  }, [isConfigured])

  const enable = useMutation({
    mutationFn: () => runWithAction('알림 받기', enableWebPush),
    onSettled: () => setPermission(readPushPermission()),
  })

  return {
    status: toWebPushStatus({ isConfigured, isSupported, permission }),
    enable,
  }
}

/**
 * 회원이 로그인해 있는 동안 웹 푸시를 이어 둔다 (앱 전체에서 한 번).
 * 권한이 허용돼 있으면 로그인할 때마다 FID를 다시 등록하고, 탭이 열려 있을 때 알림이 오면 알림함을 새로 받는다
 */
export function useWebPushSync() {
  const queryClient = useQueryClient()
  const memberId = useSessionStore((state) => state.user?.memberId ?? null)

  useEffect(() => {
    if (!memberId) return
    let isActive = true
    let stop: (() => void) | undefined
    void startWebPushSession(() => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all('member') })
    }).then((unsubscribe) => {
      if (isActive) stop = unsubscribe
      else unsubscribe()
    })
    return () => {
      isActive = false
      stop?.()
    }
  }, [memberId, queryClient])
}
