import { useSessionStore } from '@/entities/session'
import { runWithAction } from '@/shared/api'
import { env } from '@/shared/config'
import { loadPushClient, type PushClient } from '../api/firebase-messaging'
import { pushTokenApi } from '../api/push-token-api'
import {
  isWebPushConfigured,
  toServiceWorkerUrl,
  type PushPermission,
  type WebPushConfig,
} from './web-push.rules'

/** 이 기기의 FID. 등록(onRegistered)으로 받고, 로그아웃할 때 서버에서 지운다 */
let currentFid: string | null = null
let isListening = false

function getConfig(): WebPushConfig {
  return env.firebase
}

/** 설정이 없거나 브라우저가 지원하지 않으면 null (firebase를 불러오지도 않는다) */
function getPushClient(): Promise<PushClient | null> {
  const config = getConfig()
  if (!isWebPushConfigured(config)) return Promise.resolve(null)
  const { vapidKey, ...options } = config
  return loadPushClient({ options, vapidKey, serviceWorkerUrl: toServiceWorkerUrl(config) })
}

/** Notification이 없는 브라우저면 null */
export function readPushPermission(): PushPermission | null {
  return typeof Notification === 'undefined' ? null : Notification.permission
}

/** 이 브라우저에서 웹 푸시를 쓸 수 있는지 (설정 · 브라우저 지원) */
export async function isWebPushAvailable(): Promise<boolean> {
  return (await getPushClient()) !== null
}

/** FID가 바뀌면(서비스 워커가 새로 등록 등) 로그인한 회원이면 바로 다시 등록한다 */
function listenRegistered(push: PushClient) {
  if (isListening) return
  isListening = true
  push.onRegistered((fid) => {
    const isChanged = currentFid !== null && currentFid !== fid
    currentFid = fid
    if (isChanged && useSessionStore.getState().accessToken) {
      void runWithAction('알림 기기 등록', () => pushTokenApi.register(fid)).catch(() => undefined)
    }
  })
}

/** 이 기기를 FCM에 등록하고 받은 FID를 서버에 등록한다 (같은 FID를 다시 보내면 등록 갱신) */
export async function registerWebPush(): Promise<void> {
  const push = await getPushClient()
  if (!push) return
  listenRegistered(push)
  await push.register()
  if (currentFid) await pushTokenApi.register(currentFid)
}

/** 「알림 받기」: 권한을 묻고, 허용하면 등록한다. 고른 권한을 돌려준다 */
export async function enableWebPush(): Promise<PushPermission> {
  const permission = await Notification.requestPermission()
  if (permission === 'granted') await registerWebPush()
  return permission
}

/** 로그아웃 직전: 이 기기를 서버에서 지운다. 실패해도 로그아웃은 이어 간다 */
export async function unregisterWebPush(): Promise<void> {
  if (!currentFid) return
  const fid = currentFid
  await runWithAction('알림 기기 해제', () => pushTokenApi.remove(fid)).catch(() => undefined)
}

/**
 * 회원이 로그인해 있는 동안: 탭이 열려 있을 때 받은 메시지를 알리고(onMessage),
 * 권한이 이미 허용돼 있으면 등록을 갱신한다. 끊는 함수를 돌려준다
 */
export async function startWebPushSession(onMessage: () => void): Promise<() => void> {
  const push = await getPushClient()
  if (!push) return () => undefined
  const stop = push.onMessage(onMessage)
  if (readPushPermission() === 'granted') {
    void runWithAction('알림 기기 등록', registerWebPush).catch(() => undefined)
  }
  return stop
}
