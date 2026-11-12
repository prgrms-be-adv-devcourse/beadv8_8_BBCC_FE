import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isWebPushConfigured,
  toServiceWorkerUrl,
  toWebPushStatus,
  type WebPushConfig,
} from '@/features/subscribe-web-push/model/web-push.rules'

// 웹 푸시: firebase는 목으로 막고, 서버 호출(PUT · DELETE /notifications/push-tokens)만 본다
const firebase = vi.hoisted(() => ({
  isSupported: vi.fn(() => Promise.resolve(true)),
  registered: null as ((fid: string) => void) | null,
  fid: 'fid-1',
}))

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }))
vi.mock('firebase/messaging', () => ({
  isSupported: firebase.isSupported,
  getMessaging: vi.fn(() => ({})),
  onRegistered: (_messaging: unknown, listener: (fid: string) => void) => {
    firebase.registered = listener
  },
  // SDK처럼 등록이 끝나기 전에 onRegistered로 FID를 알린다
  register: vi.fn(() => {
    firebase.registered?.(firebase.fid)
    return Promise.resolve()
  }),
  onMessage: vi.fn(() => () => undefined),
}))

const api = vi.hoisted(() => ({
  put: vi.fn(() => Promise.resolve({ data: undefined })),
  delete: vi.fn(() => Promise.resolve({ data: undefined })),
  post: vi.fn(() => Promise.resolve({ data: undefined })),
}))
vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  apiClient: api,
}))

const CONFIG: WebPushConfig = {
  apiKey: 'api-key',
  authDomain: 'kidly.firebaseapp.com',
  projectId: 'kidly',
  messagingSenderId: '123',
  appId: '1:123:web:abc',
  vapidKey: 'vapid',
}
const ENV_NAMES: Record<keyof WebPushConfig, string> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
  vapidKey: 'VITE_FIREBASE_VAPID_KEY',
}

function stubFirebaseEnv(config: Partial<WebPushConfig>) {
  for (const [key, name] of Object.entries(ENV_NAMES)) {
    vi.stubEnv(name, config[key as keyof WebPushConfig] ?? '')
  }
}

function stubBrowser(permission: NotificationPermission, answer: NotificationPermission) {
  vi.stubGlobal('Notification', {
    permission,
    requestPermission: vi.fn(() => Promise.resolve(answer)),
  })
  vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn(() => Promise.resolve({})) } })
}

/** 회원 1의 Access Token (payload만 읽으므로 서명은 비워 둔다) */
const MEMBER_TOKEN = `e30.${btoa(JSON.stringify({ sub: '1', roles: ['BUYER'] }))}.`

/** 환경 변수 · 모듈 상태(FID)를 테스트마다 새로 읽는다 */
async function loadWebPush() {
  vi.resetModules()
  const webPush = await import('@/features/subscribe-web-push/model/web-push')
  const session = await import('@/entities/session')
  session.configureSignOut(webPush.unregisterWebPush)
  session.useSessionStore.getState().setAccessToken(MEMBER_TOKEN)
  return { ...webPush, session }
}

describe('웹 푸시 규칙', () => {
  it('설정 값이 하나라도 비어 있으면 끈다', () => {
    expect(isWebPushConfigured(CONFIG)).toBe(true)
    expect(isWebPushConfigured({ ...CONFIG, vapidKey: '' })).toBe(false)
    expect(isWebPushConfigured({ ...CONFIG, appId: '  ' })).toBe(false)
  })

  it('끔 → 확인 중 → 지원 안 함 → 권한 순서로 상태를 정한다', () => {
    const status = (
      isConfigured: boolean,
      isSupported: boolean | null,
      permission: NotificationPermission | null,
    ) => toWebPushStatus({ isConfigured, isSupported, permission })
    expect(status(false, true, 'granted')).toBe('off')
    expect(status(true, null, 'default')).toBe('checking')
    expect(status(true, false, 'default')).toBe('unsupported')
    expect(status(true, true, null)).toBe('unsupported')
    expect(status(true, true, 'denied')).toBe('denied')
    expect(status(true, true, 'default')).toBe('default')
    expect(status(true, true, 'granted')).toBe('granted')
  })

  it('서비스 워커 주소에 웹 앱 설정을 넣고 VAPID 키는 넣지 않는다', () => {
    const url = new URL(toServiceWorkerUrl(CONFIG), 'https://kidly.test')
    expect(url.pathname).toBe('/firebase-messaging-sw.js')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      apiKey: 'api-key',
      authDomain: 'kidly.firebaseapp.com',
      projectId: 'kidly',
      messagingSenderId: '123',
      appId: '1:123:web:abc',
    })
  })

  it('서비스 워커가 불러오는 firebase 버전이 설치한 버전과 같다', () => {
    const root = path.resolve(import.meta.dirname, '../../..')
    const sw = readFileSync(path.join(root, 'public/firebase-messaging-sw.js'), 'utf8')
    const installed = JSON.parse(
      readFileSync(path.join(root, 'node_modules/firebase/package.json'), 'utf8'),
    ) as { version: string }
    expect(sw).toContain(`const FIREBASE_VERSION = '${installed.version}'`)
  })
})

describe('웹 푸시 등록 · 해제', () => {
  beforeEach(() => {
    firebase.registered = null
    firebase.isSupported.mockImplementation(() => Promise.resolve(true))
    for (const fn of Object.values(api)) {
      fn.mockClear()
      fn.mockImplementation(() => Promise.resolve({ data: undefined }))
    }
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('환경 변수가 없으면 firebase를 부르지 않고 조용히 꺼진다', async () => {
    stubFirebaseEnv({})
    stubBrowser('granted', 'granted')
    const { isWebPushAvailable, registerWebPush } = await loadWebPush()

    expect(await isWebPushAvailable()).toBe(false)
    await registerWebPush()
    expect(firebase.isSupported).not.toHaveBeenCalled()
    expect(api.put).not.toHaveBeenCalled()
  })

  it('브라우저가 지원하지 않으면 쓸 수 없다', async () => {
    stubFirebaseEnv(CONFIG)
    stubBrowser('default', 'granted')
    firebase.isSupported.mockImplementation(() => Promise.resolve(false))
    const { isWebPushAvailable } = await loadWebPush()

    expect(await isWebPushAvailable()).toBe(false)
  })

  it('알림 받기에서 허용하면 받은 FID를 서버에 등록한다', async () => {
    stubFirebaseEnv(CONFIG)
    stubBrowser('default', 'granted')
    const { enableWebPush } = await loadWebPush()

    expect(await enableWebPush()).toBe('granted')
    expect(api.put).toHaveBeenCalledWith('/notifications/push-tokens', { fid: 'fid-1' })
  })

  it('알림 받기에서 막으면 등록하지 않는다', async () => {
    stubFirebaseEnv(CONFIG)
    stubBrowser('default', 'denied')
    const { enableWebPush } = await loadWebPush()

    expect(await enableWebPush()).toBe('denied')
    expect(api.put).not.toHaveBeenCalled()
  })

  it('권한이 허용된 채 로그인하면 FID를 다시 등록한다 (등록 갱신)', async () => {
    stubFirebaseEnv(CONFIG)
    stubBrowser('granted', 'granted')
    const { startWebPushSession } = await loadWebPush()

    await startWebPushSession(() => undefined)
    await vi.waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/notifications/push-tokens', { fid: 'fid-1' }),
    )
  })

  it('권한을 묻기 전이면 로그인해도 등록하지 않는다 (자동 권한 요청 금지)', async () => {
    stubFirebaseEnv(CONFIG)
    stubBrowser('default', 'granted')
    const { startWebPushSession } = await loadWebPush()

    await startWebPushSession(() => undefined)
    expect(Notification.requestPermission).not.toHaveBeenCalled()
    expect(api.put).not.toHaveBeenCalled()
  })

  it('로그아웃 직전에 이 기기의 FID를 지운다', async () => {
    stubFirebaseEnv(CONFIG)
    stubBrowser('granted', 'granted')
    const { registerWebPush, session } = await loadWebPush()
    await registerWebPush()

    await session.signOut()
    expect(api.delete).toHaveBeenCalledWith('/notifications/push-tokens', {
      data: { fid: 'fid-1' },
    })
    expect(api.delete.mock.invocationCallOrder[0]).toBeLessThan(
      api.post.mock.invocationCallOrder[0],
    )
    expect(session.useSessionStore.getState().accessToken).toBeNull()
  })

  it('FID 삭제가 실패해도 로그아웃은 이어 간다', async () => {
    stubFirebaseEnv(CONFIG)
    stubBrowser('granted', 'granted')
    const { registerWebPush, session } = await loadWebPush()
    await registerWebPush()
    api.delete.mockImplementation(() => Promise.reject(new Error('network')))

    await session.signOut()
    expect(api.post).toHaveBeenCalledWith('/auth/logout', undefined, { skipAuth: true })
    expect(session.useSessionStore.getState().accessToken).toBeNull()
  })

  it('FID 해제 · FID가 바뀌어 다시 등록하는 호출도 행동 이름으로 흐름 패널에 남긴다', async () => {
    stubFirebaseEnv(CONFIG)
    stubBrowser('granted', 'granted')
    const { registerWebPush, session } = await loadWebPush()
    const { useApiFlowLog } = await import('@/shared/api')
    const actionOf = () => useApiFlowLog.getState().currentAction
    await registerWebPush()

    const putActions: (string | null)[] = []
    api.put.mockImplementation(() => {
      putActions.push(actionOf())
      return Promise.resolve({ data: undefined })
    })
    firebase.registered?.('fid-2')
    await vi.waitFor(() => expect(putActions).toEqual(['알림 기기 등록']))

    let deleteAction: string | null = null
    api.delete.mockImplementation(() => {
      deleteAction = actionOf()
      return Promise.resolve({ data: undefined })
    })
    await session.signOut()
    expect(deleteAction).toBe('알림 기기 해제')
  })

  it('firebase를 한 번 못 불러와도(네트워크 등) 다음에 다시 시도한다', async () => {
    stubFirebaseEnv(CONFIG)
    stubBrowser('granted', 'granted')
    firebase.isSupported.mockImplementationOnce(() => Promise.reject(new Error('network')))
    const { isWebPushAvailable } = await loadWebPush()

    expect(await isWebPushAvailable()).toBe(false)
    expect(await isWebPushAvailable()).toBe(true)
  })

  it('등록한 적이 없으면 로그아웃 때 지우지 않는다', async () => {
    stubFirebaseEnv(CONFIG)
    stubBrowser('denied', 'denied')
    const { session } = await loadWebPush()

    await session.signOut()
    expect(api.delete).not.toHaveBeenCalled()
    expect(api.post).toHaveBeenCalled()
  })
})
