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
import { memberIdOf, problem } from './mock-utils'

const UPLOAD_URLS_PATH = '/api/v1/seller/product-images/upload-urls'
/** 실제 저장 주소와 같은 모양 (S3에 파일은 없으므로 화면은 기본 이미지를 보여 준다) */
const BUCKET_URL = 'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com'
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const UPLOAD_URL_TTL_MS = 5 * 60 * 1000

/** BE와 같은 조건으로 400을 낸다: 1 ~ 10장, jpeg · png · webp, 1바이트 ~ 10MB */
function invalidUploadDetail(files: ProductImageUploadUrlsRequestDto['files']): string | null {
  if (files.length === 0) return '업로드할 이미지를 하나 이상 보내 주세요.'
  const tooMany = validateImageCount(0, files.length)
  if (tooMany) return tooMany
  if (files.some((file) => !canUploadImageType(file.contentType))) {
    return '이미지는 JPEG · PNG · WEBP 형식만 올릴 수 있습니다.'
  }
  if (files.some((file) => !canUploadImageSize(file.contentLength))) {
    return '이미지 크기는 1바이트 이상 10MB 이하여야 합니다.'
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
      const { files = [] } = (request.body ?? {}) as Partial<ProductImageUploadUrlsRequestDto>
      const detail = invalidUploadDetail(files)
      if (detail) return problem(400, '잘못된 이미지 업로드 요청입니다', detail, UPLOAD_URLS_PATH)
      const sellerId = memberIdOf(request) ?? '0'
      const expiresAt = new Date(Date.now() + UPLOAD_URL_TTL_MS).toISOString()
      const data: ProductImageUploadUrlsDto = {
        uploads: files.map((file) => {
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
