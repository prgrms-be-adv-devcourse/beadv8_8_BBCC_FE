/*
 * 웹 푸시 서비스 워커 (Firebase Cloud Messaging, FID 등록).
 * 서비스 워커는 import.meta.env를 못 읽으므로, 앱이 등록할 때 웹 앱 설정(공개 값)을 주소 쿼리로 넘긴다
 * (features/subscribe-web-push의 toServiceWorkerUrl).
 * 백그라운드 알림 표시와 webpush.fcm_options.link로 이동은 SDK가 한다.
 * FIREBASE_VERSION은 package.json의 firebase와 같게 둔다 (tests/unit/features/web-push.test.ts가 확인)
 */
const FIREBASE_VERSION = '13.3.0'

// 링크가 없는 알림(서버가 https 절대 주소일 때만 링크를 넣는다)을 누르면 알림함을 연다.
// SDK가 클릭을 먼저 가져가므로 SDK를 불러오기 전에 등록한다
self.addEventListener('notificationclick', (event) => {
  const message = event.notification.data && event.notification.data.FCM_MSG
  if (!message || event.action) return
  const link =
    (message.fcmOptions && message.fcmOptions.link) ||
    (message.notification && message.notification.click_action)
  if (link) return
  event.stopImmediatePropagation()
  event.notification.close()
  event.waitUntil(self.clients.openWindow('/notifications'))
})

importScripts(
  `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`,
  `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js`,
)

const params = new URL(self.location.href).searchParams
firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
})
firebase.messaging()
