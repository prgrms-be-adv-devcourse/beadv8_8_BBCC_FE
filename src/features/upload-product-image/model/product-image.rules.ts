import {
  PRODUCT_IMAGE_CONTENT_TYPES,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_COUNT,
} from '../api/product-image.dto'

/** 서명한 형식과 업로드 헤더가 글자까지 같아야 하므로 대소문자를 바꾸지 않고 비교한다 */
export function canUploadImageType(type: string): boolean {
  return (PRODUCT_IMAGE_CONTENT_TYPES as readonly string[]).includes(type)
}

export function canUploadImageSize(size: number): boolean {
  return size > 0 && size <= PRODUCT_IMAGE_MAX_BYTES
}

/** 이미 올린 장수에 더해도 최대 장수 이하인지. 넘으면 화면에 보여 줄 문구 */
export function validateImageCount(currentCount: number, addingCount: number): string | null {
  return currentCount + addingCount > PRODUCT_IMAGE_MAX_COUNT
    ? `사진은 ${PRODUCT_IMAGE_MAX_COUNT}장까지 올릴 수 있어요.`
    : null
}

/** 업로드 주소는 만료 시각부터 쓸 수 없다 (PUT을 그 전에 시작해야 함) */
export function isUploadUrlExpired(expiresAt: string, now: Date): boolean {
  return now.getTime() >= new Date(expiresAt).getTime()
}
