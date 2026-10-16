import { newRequestKey } from '@/shared/lib'
import type { UpdateProductRequestDto } from '@/entities/product'
import {
  canUploadImageSize,
  canUploadImageType,
  validateImageCount,
  type ProductImageUploadUrlsDto,
  type ProductImageUploadUrlsRequestDto,
} from '@/features/upload-product-image'
import { MOCK_UPLOAD_URL_PREFIX, type MockHandler } from '@/shared/api'
import { memberIdOf, problem, rolesOf } from './mock-utils'

const UPLOAD_URLS_PATH = '/api/v1/seller/product-images/upload-urls'
/** 실제 저장 주소와 같은 모양 (S3에 파일은 없으므로 화면은 기본 이미지를 보여 준다) */
const BUCKET_URL = 'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com'
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const UPLOAD_URL_TTL_MS = 5 * 60 * 1000
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000

/** BE처럼 서울 시간을 시간대 없이 (LocalDateTime, 예: 2026-10-16T12:05:00) */
function seoulLocalDateTime(epochMs: number): string {
  return new Date(epochMs + SEOUL_OFFSET_MS).toISOString().slice(0, 19)
}

const INVALID_TYPE = 'jpeg, png, webp 이미지만 올릴 수 있습니다.'
const INVALID_SIZE = '이미지는 한 장에 1바이트 이상 10MB 이하로 올려 주세요.'

/** BE와 같은 조건 · 문구("필드: 메시지")로 400을 낸다: 1 ~ 10장, jpeg · png · webp, 1바이트 ~ 10MB */
function invalidUploadDetail(files: unknown): string | null {
  if (!Array.isArray(files)) return 'files: 이미지 목록을 넣어 주세요.'
  if (files.length === 0 || validateImageCount(0, files.length)) {
    return 'files: 이미지는 한 번에 1장 이상 10장 이하로 요청해 주세요.'
  }
  const list = files as ProductImageUploadUrlsRequestDto['files']
  for (const [index, file] of list.entries()) {
    if (!canUploadImageType(file.contentType)) return `files[${index}].contentType: ${INVALID_TYPE}`
    if (!canUploadImageSize(file.contentLength))
      return `files[${index}].contentLength: ${INVALID_SIZE}`
  }
  return null
}

// 상품 수정(PATCH)과 이미지 업로드 주소 발급만 BE에 없어 목으로 응답한다.
// 목록 · 상세는 실제 API라 목 수정은 화면에 반영되지 않는다 (요청이 오류 없이 끝나는 것까지만)
export const productHandlers: MockHandler[] = [
  {
    method: 'PATCH',
    path: '/seller/products/:productId',
    handle: (request) => {
      const body = request.body as UpdateProductRequestDto
      if (!body.name?.trim()) {
        return problem(
          400,
          '잘못된 요청입니다',
          '상품명을 입력해 주세요.',
          `/api/v1/seller/products/${request.params.productId}`,
        )
      }
      return { status: 200 }
    },
  },
  {
    // 목 업로드 주소는 putToPresignedUrl이 네트워크로 보내지 않고 성공으로 끝낸다
    method: 'POST',
    path: '/seller/product-images/upload-urls',
    handle: (request) => {
      const sellerId = memberIdOf(request)
      if (!sellerId) {
        return problem(401, '로그인이 필요합니다', '로그인이 필요합니다.', UPLOAD_URLS_PATH)
      }
      if (!rolesOf(request).includes('SELLER')) {
        return problem(403, '권한이 없습니다', '판매자만 올릴 수 있습니다.', UPLOAD_URLS_PATH)
      }
      const { files } = (request.body ?? {}) as Partial<ProductImageUploadUrlsRequestDto>
      const detail = invalidUploadDetail(files)
      if (detail) return problem(400, '잘못된 요청입니다', detail, UPLOAD_URLS_PATH)
      // 위 검사에서 목록인지 확인했다
      const valid = files as ProductImageUploadUrlsRequestDto['files']
      const expiresAt = seoulLocalDateTime(Date.now() + UPLOAD_URL_TTL_MS)
      const data: ProductImageUploadUrlsDto = {
        uploads: valid.map((file) => {
          const key = `dev/products/${sellerId}/${newRequestKey()}.${EXTENSIONS[file.contentType]}`
          return {
            uploadUrl: `${MOCK_UPLOAD_URL_PREFIX}${key}`,
            imageUrl: `${BUCKET_URL}/${key}`,
            expiresAt,
          }
        }),
      }
      return { status: 200, data }
    },
  },
]
