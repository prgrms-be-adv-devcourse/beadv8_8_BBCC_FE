// 가짜 백엔드의 찜 API (BE community FavoriteController). 응답 모양 · 오류 규칙만 흉내 낸다.
// 상품 정보는 server.mjs가 넘기는 productView(productId) → { name, thumbnailUrl, displayStatus } | null (BE 상품 복사본)
// 결과는 { status, body } 또는 { status, title, detail }
const MAX_PRODUCT_IDS = 50
const SEOUL_OFFSET_MS = 9 * 3600e3

/** { memberId, productId, favoritedAt, seq } */
const favorites = []
let nextSeq = 1

const seoulNow = () => new Date(Date.now() + SEOUL_OFFSET_MS).toISOString().slice(0, 19)
const error = (status, title, detail) => ({ status, title, detail })
const ERRORS = {
  productId: error(400, '잘못된 상품 ID입니다', 'productId는 상품의 ID(양의 정수)로 보내 주세요.'),
  productIds: error(
    400,
    '잘못된 상품 ID 목록입니다',
    'productIds는 쉼표로 구분한 상품 ID 1~50개로 보내 주세요. cursor와 함께 보낼 수 없습니다.',
  ),
  pageSize: error(400, '잘못된 페이지 크기입니다', 'size는 1 이상 50 이하 정수로 보내 주세요.'),
  cursor: error(
    400,
    '잘못된 커서입니다',
    'cursor는 직전 응답의 nextCursor를 그대로 보내 주세요. 처음부터 읽으려면 cursor를 빼고 보내 주세요.',
  ),
  notFound: error(
    404,
    '찜할 수 없는 상품입니다',
    '없거나 아직 판매를 시작하지 않은 상품입니다. 상품 목록에서 다시 골라 주세요.',
  ),
  saleEnded: error(409, '판매가 끝난 상품입니다', '판매가 끝난 상품은 새로 찜할 수 없습니다.'),
}

/** 양의 정수 문자열이면 숫자, 아니면 null */
function idOf(raw) {
  const text = String(raw ?? '').trim()
  return /^\d+$/.test(text) && Number(text) > 0 ? Number(text) : null
}

const newestFirst = (a, b) => b.seq - a.seq

function itemOf(favorite, productView) {
  const view = productView(String(favorite.productId))
  return {
    productId: String(favorite.productId),
    productName: view?.name ?? null,
    thumbnailUrl: view?.thumbnailUrl ?? null,
    displayStatus: view?.displayStatus ?? null,
    favoritedAt: favorite.favoritedAt,
  }
}

/** 공개 API: 찜 수. 해당 없으면 null */
export function publicFavoriteRoute(m, p, query) {
  if (m !== 'GET' || p !== '/favorites/summary') return null
  const id = idOf(query.get('productId'))
  if (id === null) return ERRORS.productId
  return {
    status: 200,
    body: {
      productId: String(id),
      favoriteCount: favorites.filter((f) => f.productId === id).length,
    },
  }
}

/** 로그인 회원 API: 찜 · 해제 · 내 찜. 해당 없으면 null */
export function memberFavoriteRoute(m, p, query, { memberId, productView }) {
  const matched = p.match(/^\/favorites\/([^/]+)$/)
  if (matched && matched[1] !== 'summary' && (m === 'PUT' || m === 'DELETE')) {
    const id = idOf(decodeURIComponent(matched[1]))
    if (id === null) return ERRORS.productId
    const index = favorites.findIndex((f) => f.memberId === memberId && f.productId === id)
    if (m === 'DELETE') {
      if (index >= 0) favorites.splice(index, 1)
      return { status: 204 }
    }
    if (index >= 0) return { status: 204 }
    const view = productView(String(id))
    if (!view) return ERRORS.notFound
    if (view.displayStatus === 'SALE_ENDED') return ERRORS.saleEnded
    favorites.push({ memberId, productId: id, favoritedAt: seoulNow(), seq: nextSeq++ })
    return { status: 204 }
  }
  if (m !== 'GET' || p !== '/favorites') return null
  const mine = favorites.filter((f) => f.memberId === memberId).sort(newestFirst)
  const rawIds = query.get('productIds')
  if (rawIds !== null) {
    if (query.get('cursor') !== null) return ERRORS.productIds
    const parts = rawIds.split(',')
    if (parts.length > MAX_PRODUCT_IDS) return ERRORS.productIds
    const ids = parts.map(idOf)
    if (ids.some((id) => id === null)) return ERRORS.productIds
    const wanted = new Set(ids)
    return {
      status: 200,
      body: {
        items: mine.filter((f) => wanted.has(f.productId)).map((f) => itemOf(f, productView)),
        nextCursor: null,
      },
    }
  }
  const size = query.get('size') === null ? 20 : idOf(query.get('size'))
  if (size === null || size > 50) return ERRORS.pageSize
  let start = 0
  if (query.get('cursor') !== null) {
    start = idOf(Buffer.from(query.get('cursor'), 'base64url').toString())
    if (start === null) return ERRORS.cursor
  }
  const end = start + size
  return {
    status: 200,
    body: {
      items: mine.slice(start, end).map((f) => itemOf(f, productView)),
      nextCursor: end < mine.length ? Buffer.from(String(end)).toString('base64url') : null,
    },
  }
}
