/** Firebase 웹 앱 설정 + VAPID 공개 키 (모두 공개 값) */
export type WebPushConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  messagingSenderId: string
  appId: string
  vapidKey: string
}

/** 브라우저 알림 권한 (Notification.permission과 같은 값) */
export type PushPermission = 'default' | 'denied' | 'granted'

/**
 * 알림 받기 상태.
 * off: 설정이 없어 기능을 끔(버튼도 숨김) · checking: 지원 여부 확인 중 · unsupported: 이 브라우저는 웹 푸시 불가
 * denied: 사용자가 막음 · default: 아직 묻지 않음(버튼) · granted: 받는 중
 */
export type WebPushStatus = 'off' | 'checking' | 'unsupported' | PushPermission

/** 값이 하나라도 비어 있으면 웹 푸시를 끈다 */
export function isWebPushConfigured(config: WebPushConfig): boolean {
  return Object.values(config).every((value) => value.trim() !== '')
}

export function toWebPushStatus({
  isConfigured,
  isSupported,
  permission,
}: {
  isConfigured: boolean
  /** 확인 전이면 null */
  isSupported: boolean | null
  /** Notification이 없는 브라우저면 null */
  permission: PushPermission | null
}): WebPushStatus {
  if (!isConfigured) return 'off'
  if (isSupported === null) return 'checking'
  if (!isSupported || permission === null) return 'unsupported'
  return permission
}

export const SERVICE_WORKER_PATH = '/firebase-messaging-sw.js'

/**
 * 서비스 워커는 import.meta.env를 못 읽으므로 웹 앱 설정을 등록 주소 쿼리로 넘긴다.
 * VAPID 키는 서비스 워커에 필요 없어 넣지 않는다
 */
export function toServiceWorkerUrl(config: WebPushConfig): string {
  const { apiKey, authDomain, projectId, messagingSenderId, appId } = config
  const query = new URLSearchParams({ apiKey, authDomain, projectId, messagingSenderId, appId })
  return `${SERVICE_WORKER_PATH}?${query.toString()}`
}
