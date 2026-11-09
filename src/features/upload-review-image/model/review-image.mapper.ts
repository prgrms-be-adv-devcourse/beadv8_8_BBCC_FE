import type { ReviewImageUploadDto, ReviewImageUploadRequestDto } from '../api/review-image.dto'

/** 발급받은 업로드 한 곳 */
export type ReviewUploadTarget = { uploadUrl: string; imageUrl: string; expiresAt: string }

/** 원본이 아니라 실제로 올릴 Blob(줄인 결과)의 값을 보낸다. 다르면 S3가 서명 불일치(403)로 거절한다 */
export function toReviewUploadRequest(blobs: Blob[]): ReviewImageUploadRequestDto {
  return { files: blobs.map((blob) => ({ contentType: blob.type, contentLength: blob.size })) }
}

const HAS_TIME_ZONE = /(Z|[+-]\d{2}:\d{2})$/

/** BE는 만료 시각을 서울 시간으로, 시간대 없이 준다. 브라우저 시간대로 읽히지 않게 +09:00을 붙인다 */
export function toReviewUploadTargets(dto: ReviewImageUploadDto): ReviewUploadTarget[] {
  return dto.files.map((file) => ({
    uploadUrl: file.uploadUrl,
    imageUrl: file.imageUrl,
    expiresAt: HAS_TIME_ZONE.test(file.expiresAt) ? file.expiresAt : `${file.expiresAt}+09:00`,
  }))
}
