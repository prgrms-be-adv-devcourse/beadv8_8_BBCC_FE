// 가짜 백엔드의 리뷰 API (BE community ReviewController · ReviewQueryController · ReviewEligibilityController · ReviewImageController).
// 응답 모양만 흉내 낸다. 작성 자격은 구매확정한 주문상품(주문 저장소)에서 바로 만든다 (BE는 구매확정 이벤트로 만든다).
// 결과는 { status, body } 또는 { status, title, detail }
import { randomUUID } from 'node:crypto'

const BUCKET_URL = 'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com'
const FITS = ['SMALL', 'TRUE_TO_SIZE', 'LARGE']
const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const IMAGE_EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const SEOUL_OFFSET_MS = 9 * 3600e3

const reviews = []
let nextReviewId = 1

const seoulNow = (plusMs = 0) =>
  new Date(Date.now() + SEOUL_OFFSET_MS + plusMs).toISOString().slice(0, 19)

const error = (status, title, detail) => ({ status, title, detail })
const ERRORS = {
  rating: error(400, '잘못된 별점입니다', '별점은 1 이상 5 이하 정수로 보내 주세요.'),
  content: error(
    400,
    '잘못된 리뷰 본문입니다',
    '본문은 공백을 빼고 1자 이상 1000자 이하로 써 주세요.',
  ),
  fit: error(
    400,
    '잘못된 사이즈 평가입니다',
    'fit은 SMALL · TRUE_TO_SIZE · LARGE 중 하나로 보내 주세요.',
  ),
  fitNotApplicable: error(
    400,
    '사이즈 평가를 남길 수 없는 상품입니다',
    '사이즈가 없는 상품은 fit을 빼고 보내 주세요.',
  ),
  tooManyImages: error(
    400,
    '사진이 너무 많습니다',
    `사진은 최대 ${MAX_IMAGES}장까지 올릴 수 있어요. 사진 수를 줄여 보내 주세요.`,
  ),
  imageUrl: error(
    400,
    '쓸 수 없는 사진 주소입니다',
    '업로드 주소 발급으로 받은 imageUrl만 보내 주세요.',
  ),
  imageFile: error(
    400,
    '올릴 수 없는 사진 파일입니다',
    'JPG · PNG · WEBP 형식, 10MB 이하 사진만 올릴 수 있어요.',
  ),
  noFields: error(400, '바꿀 값이 없습니다', '바꿀 값을 하나 이상 보내 주세요.'),
  productId: error(400, '잘못된 상품 ID입니다', 'productId는 상품의 ID(양의 정수)로 보내 주세요.'),
  notEligible: error(
    403,
    '리뷰를 쓸 수 없는 주문상품입니다',
    '구매확정한 내 주문상품에만 리뷰를 쓸 수 있습니다.',
  ),
  forbidden: error(403, '내 리뷰가 아닙니다', '내가 쓴 리뷰만 고치거나 지울 수 있습니다.'),
  notFound: error(
    404,
    '리뷰를 찾을 수 없습니다',
    '없거나 지워진 리뷰입니다. 리뷰 목록을 새로고침해 주세요.',
  ),
  alreadyWritten: error(
    409,
    '이미 리뷰를 쓴 주문상품입니다',
    '주문상품마다 리뷰는 하나만 쓸 수 있습니다.',
  ),
}

/** 커서 = 다음 쪽 시작 위치 (불투명 문자열) */
function cursorPage(items, query) {
  const size = Number(query.get('size') ?? 20)
  const start = query.get('cursor')
    ? Number(Buffer.from(query.get('cursor'), 'base64url').toString())
    : 0
  const end = start + size
  return {
    items: items.slice(start, end),
    nextCursor: end < items.length ? Buffer.from(String(end)).toString('base64url') : null,
  }
}

const responseOf = ({ memberId: _m, productName: _p, ...review }) => ({
  ...review,
  imageUrls: [...review.imageUrls],
})
const listItemOf = (review) => ({
  ...responseOf(review),
  productName: review.productName,
  thumbnailUrl: null,
  displayStatus: 'ON_SALE',
  visibility: 'PUBLIC',
})
const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt) || b.reviewId - a.reviewId

function eligibleOf(orders, memberId) {
  const reviewed = new Set(reviews.map((review) => review.orderItemId))
  return orders
    .filter((order) => order.memberId === memberId)
    .flatMap((order) =>
      order.items
        .filter((item) => item.status === 'CONFIRMED' && !reviewed.has(item.orderItemId))
        .map((item) => ({
          orderItemId: item.orderItemId,
          orderId: String(order.orderId),
          productId: item.productId,
          productName: item.productName,
          thumbnailUrl: null,
          size: item.size ?? null,
          confirmedAt: item.confirmedAt,
        })),
    )
    .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))
}

const isRating = (value) => Number.isInteger(value) && value >= 1 && value <= 5
const isContent = (value) =>
  typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= 1000

/** fit · imageUrls 검사. 틀리면 오류, 맞으면 null */
function invalidOptional(body, size) {
  if ('fit' in body && body.fit !== null) {
    if (!FITS.includes(body.fit)) return ERRORS.fit
    if (size === null) return ERRORS.fitNotApplicable
  }
  if ('imageUrls' in body && body.imageUrls !== null) {
    if (!Array.isArray(body.imageUrls) || body.imageUrls.some((url) => typeof url !== 'string'))
      return ERRORS.imageUrl
    if (body.imageUrls.length > MAX_IMAGES) return ERRORS.tooManyImages
    if (body.imageUrls.some((url) => !url.startsWith(`${BUCKET_URL}/`))) return ERRORS.imageUrl
  }
  return null
}

function summaryOf(productId) {
  const mine = reviews.filter((review) => review.productId === productId)
  const count = (fit) => mine.filter((review) => review.fit === fit).length
  const total = mine.reduce((sum, review) => sum + review.rating, 0)
  return {
    productId,
    reviewCount: mine.length,
    averageRating: mine.length ? Math.round((total / mine.length) * 10) / 10 : null,
    fitSummary: { small: count('SMALL'), trueToSize: count('TRUE_TO_SIZE'), large: count('LARGE') },
  }
}

/** 공개 API(상품 리뷰 · 요약). 로그인 없이 부른다. 해당 없으면 null */
export function publicReviewRoute(m, p, query) {
  if (m !== 'GET' || !['/reviews', '/reviews/summary'].includes(p)) return null
  const productId = query.get('productId')
  if (!/^\d+$/.test(productId ?? '')) return ERRORS.productId
  if (p === '/reviews/summary') return { status: 200, body: summaryOf(productId) }
  const items = reviews
    .filter((review) => review.productId === productId)
    .sort(newestFirst)
    .map(listItemOf)
  return { status: 200, body: cursorPage(items, query) }
}

/** 로그인 회원 API. 해당 없으면 null */
export function memberReviewRoute(m, p, query, body, { memberId, nickname, orders }) {
  if (m === 'GET' && p === '/reviews/me') {
    const items = reviews
      .filter((review) => review.memberId === memberId)
      .sort(newestFirst)
      .map(listItemOf)
    return { status: 200, body: cursorPage(items, query) }
  }
  if (m === 'GET' && p === '/reviews/eligible')
    return { status: 200, body: cursorPage(eligibleOf(orders, memberId), query) }
  if (m === 'POST' && p === '/reviews/images/upload-urls') {
    const files = body?.files
    if (!Array.isArray(files) || files.length === 0) return ERRORS.imageFile
    if (files.length > MAX_IMAGES) return ERRORS.tooManyImages
    if (
      files.some(
        (file) =>
          !IMAGE_EXTENSIONS[file?.contentType] ||
          !(file.contentLength >= 1 && file.contentLength <= MAX_IMAGE_BYTES),
      )
    )
      return ERRORS.imageFile
    const expiresAt = seoulNow(5 * 60e3)
    return {
      status: 200,
      body: {
        files: files.map((file) => {
          const imageUrl = `${BUCKET_URL}/local/reviews/${memberId}/${randomUUID()}.${IMAGE_EXTENSIONS[file.contentType]}`
          return {
            uploadUrl: `${imageUrl}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=300&X-Amz-Signature=fake`,
            imageUrl,
            expiresAt,
          }
        }),
      },
    }
  }
  if (m === 'POST' && p === '/reviews') {
    const target = orders
      .flatMap((order) => order.items.map((item) => ({ order, item })))
      .find(({ item }) => item.orderItemId === String(body?.orderItemId))
    if (reviews.some((review) => review.orderItemId === String(body?.orderItemId)))
      return ERRORS.alreadyWritten
    if (!target || target.order.memberId !== memberId || target.item.status !== 'CONFIRMED')
      return ERRORS.notEligible
    if (!isRating(body.rating)) return ERRORS.rating
    if (!isContent(body.content)) return ERRORS.content
    const size = target.item.size ?? null
    const invalid = invalidOptional(body, size)
    if (invalid) return invalid
    const at = seoulNow()
    const review = {
      reviewId: String(nextReviewId++),
      orderItemId: target.item.orderItemId,
      productId: target.item.productId,
      rating: body.rating,
      content: body.content.trim(),
      nickname,
      authorWithdrawn: false,
      fit: body.fit ?? null,
      purchasedSize: size,
      imageUrls: body.imageUrls ?? [],
      createdAt: at,
      updatedAt: at,
      memberId,
      productName: target.item.productName,
    }
    reviews.push(review)
    return { status: 201, body: responseOf(review) }
  }
  const matched = p.match(/^\/reviews\/(\d+)$/)
  if (!matched || !['PATCH', 'DELETE'].includes(m)) return null
  const index = reviews.findIndex((review) => review.reviewId === matched[1])
  if (index < 0) return ERRORS.notFound
  const review = reviews[index]
  if (review.memberId !== memberId) return ERRORS.forbidden
  if (m === 'DELETE') {
    reviews.splice(index, 1)
    return { status: 204 }
  }
  const keys = ['rating', 'content', 'fit', 'imageUrls'].filter((key) => key in (body ?? {}))
  if (keys.length === 0) return ERRORS.noFields
  if ('rating' in body && !isRating(body.rating)) return ERRORS.rating
  if ('content' in body && !isContent(body.content)) return ERRORS.content
  if ('imageUrls' in body && body.imageUrls === null) return ERRORS.imageUrl
  const invalid = invalidOptional(body, review.purchasedSize)
  if (invalid) return invalid
  if ('rating' in body) review.rating = body.rating
  if ('content' in body) review.content = body.content.trim()
  if ('fit' in body) review.fit = body.fit
  if ('imageUrls' in body) review.imageUrls = body.imageUrls
  review.updatedAt = seoulNow()
  return { status: 200, body: responseOf(review) }
}
