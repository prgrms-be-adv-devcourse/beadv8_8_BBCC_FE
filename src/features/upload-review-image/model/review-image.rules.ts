import { REVIEW_IMAGE_CONTENT_TYPES, REVIEW_IMAGE_MAX_BYTES } from '../api/review-image.dto'

/** 서명한 형식과 업로드 헤더가 글자까지 같아야 하므로 대소문자를 바꾸지 않고 비교한다 */
export function canUploadReviewImageType(type: string): boolean {
  return (REVIEW_IMAGE_CONTENT_TYPES as readonly string[]).includes(type)
}

export function canUploadReviewImageSize(size: number): boolean {
  return size > 0 && size <= REVIEW_IMAGE_MAX_BYTES
}
