// 가짜 백엔드의 알림함 API (BE InboxNotificationController · ChildInboxNotificationController).
// 응답 모양만 흉내 낸다. BE는 다른 서비스 이벤트로 알림을 만들지만, 여기서는 받는 사람이 처음 볼 때 두 건을 넣어 둔다.
// 결과는 { status, body } 또는 { status, title, detail }
const SEOUL_OFFSET_MS = 9 * 3600e3
const MAX_SIZE = 100

const inbox = []
const seeded = new Set()
let nextId = 1

const seoulAt = (minutesAgo) =>
  new Date(Date.now() + SEOUL_OFFSET_MS - minutesAgo * 60e3).toISOString().slice(0, 19)

const SEEDS = {
  member: [
    ['WELCOME', 'Kidly에 오신 걸 환영해요', '아이에게 맞는 옷을 찾아보세요.', null],
    ['ORDER_PAID', '주문이 결제됐어요', '주문 내역에서 배송 상황을 볼 수 있어요.', '/orders'],
  ],
  child: [
    ['WELCOME', 'Kidly에 오신 걸 환영해요', '마음에 드는 옷을 조르기로 보내 보세요.', null],
    ['WISH_PAID', '조르기가 결제됐어요', '보호자가 조르기를 결제했어요.', '/child/wishes'],
  ],
}

function seed(recipient, type) {
  if (seeded.has(recipient)) return
  seeded.add(recipient)
  SEEDS[type].forEach(([kind, title, body, linkPath], index) =>
    inbox.push({
      notificationId: nextId++,
      recipient,
      type: kind,
      title,
      body,
      linkPath,
      read: false,
      createdAt: seoulAt(SEEDS[type].length - index),
    }),
  )
}

const mine = (recipient) =>
  inbox.filter((n) => n.recipient === recipient).sort((a, b) => b.notificationId - a.notificationId)

const toResponse = ({ recipient: _recipient, ...rest }) => rest

/**
 * @param recipient 받는 사람 키 (회원 `member:1` · 자녀 계정 `child:3`)
 * @param type 'member' | 'child' (넣어 둘 알림 종류)
 */
export function notificationRoute(m, p, query, recipient, type) {
  const base = type === 'child' ? '/child/notifications' : '/notifications'
  if (p !== base && !p.startsWith(`${base}/`)) return null
  seed(recipient, type)
  const rest = p.slice(base.length)
  if (m === 'GET' && rest === '') {
    const page = Number(query.get('page') ?? 0)
    const size = Number(query.get('size') ?? 20)
    if (!(page >= 0) || !(size >= 1 && size <= MAX_SIZE))
      return { status: 400, title: '잘못된 요청입니다', detail: 'page · size를 확인해 주세요.' }
    const all = mine(recipient)
    return {
      status: 200,
      body: {
        content: all.slice(page * size, (page + 1) * size).map(toResponse),
        page,
        size,
        totalElements: all.length,
        totalPages: Math.ceil(all.length / size),
        hasNext: (page + 1) * size < all.length,
      },
    }
  }
  if (m === 'GET' && rest === '/unread-count')
    return { status: 200, body: { count: mine(recipient).filter((n) => !n.read).length } }
  if (m === 'PATCH' && rest === '/read-all') {
    mine(recipient).forEach((n) => (n.read = true))
    return { status: 204 }
  }
  const read = m === 'PATCH' && rest.match(/^\/(\d+)\/read$/)
  if (read) {
    const target = mine(recipient).find((n) => n.notificationId === Number(read[1]))
    if (!target)
      return { status: 404, title: '알림을 찾을 수 없습니다', detail: '알림을 찾을 수 없습니다.' }
    target.read = true
    return { status: 204 }
  }
  return null
}
