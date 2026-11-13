import type { FirebaseOptions } from 'firebase/app'

/** firebase 기본 범위와 같다. 앱 화면과 겹치지 않는 범위라 다른 서비스 워커와 부딪히지 않는다 */
const SERVICE_WORKER_SCOPE = '/firebase-cloud-messaging-push-scope'

export type PushClientConfig = {
  options: FirebaseOptions
  vapidKey: string
  serviceWorkerUrl: string
}

/** Firebase Messaging 중 Kidly가 쓰는 것만 (FID 등록 · 포그라운드 메시지) */
export type PushClient = {
  /** 이 기기를 FCM에 등록한다. 끝나기 전에 onRegistered가 FID를 받는다 (권한이 없으면 실패) */
  register: () => Promise<void>
  /** 등록될 때마다 · FID가 바뀔 때 FID를 받는다. 받는 곳은 하나다 (다시 부르면 바뀐다) */
  onRegistered: (listener: (fid: string) => void) => void
  /** 탭이 열려 있을 때 받은 메시지. 끊는 함수를 돌려준다 */
  onMessage: (listener: () => void) => () => void
}

let pushClient: Promise<PushClient | null> | undefined

/**
 * firebase는 처음 쓸 때 불러온다 (번들 분리). 브라우저가 웹 푸시를 지원하지 않으면 null.
 * 불러오기에 실패하면(네트워크 등) 기억하지 않고 다음 호출에서 다시 시도한다
 */
export function loadPushClient(config: PushClientConfig): Promise<PushClient | null> {
  pushClient ??= createPushClient(config).catch(() => {
    pushClient = undefined
    return null
  })
  return pushClient
}

async function createPushClient({
  options,
  vapidKey,
  serviceWorkerUrl,
}: PushClientConfig): Promise<PushClient | null> {
  const [{ initializeApp }, messagingSdk] = await Promise.all([
    import('firebase/app'),
    import('firebase/messaging'),
  ])
  if (!(await messagingSdk.isSupported())) return null
  const messaging = messagingSdk.getMessaging(initializeApp(options))
  return {
    register: async () => {
      const serviceWorkerRegistration = await navigator.serviceWorker.register(serviceWorkerUrl, {
        scope: SERVICE_WORKER_SCOPE,
      })
      await messagingSdk.register(messaging, { vapidKey, serviceWorkerRegistration })
    },
    onRegistered: (listener) => {
      messagingSdk.onRegistered(messaging, listener)
    },
    onMessage: (listener) => messagingSdk.onMessage(messaging, () => listener()),
  }
}
