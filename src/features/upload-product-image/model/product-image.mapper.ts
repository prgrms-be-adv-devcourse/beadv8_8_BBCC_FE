import type {
  ProductImageUploadUrlsDto,
  ProductImageUploadUrlsRequestDto,
} from '../api/product-image.dto'

/** 발급받은 업로드 한 곳. imageUrl을 상품 등록 · 수정 요청에 넣는다 */
export type UploadTarget = { uploadUrl: string; imageUrl: string; expiresAt: string }

/** 원본 파일이 아니라 실제로 올릴 Blob(줄인 결과)의 값을 보낸다. 다르면 S3가 서명 불일치(403)로 거절한다 */
export function toUploadUrlsRequest(blobs: Blob[]): ProductImageUploadUrlsRequestDto {
  return { files: blobs.map((blob) => ({ contentType: blob.type, contentLength: blob.size })) }
}

const HAS_TIME_ZONE = /(Z|[+-]\d{2}:\d{2})$/

/** BE는 만료 시각을 서울 시간으로, 시간대 없이 준다. 그대로 읽으면 브라우저 시간대로 해석되므로 +09:00을 붙인다 */
function toSeoulTime(localDateTime: string): string {
  return HAS_TIME_ZONE.test(localDateTime) ? localDateTime : `${localDateTime}+09:00`
}

export function toUploadTargets(dto: ProductImageUploadUrlsDto): UploadTarget[] {
  return dto.uploads.map((upload) => ({
    uploadUrl: upload.uploadUrl,
    imageUrl: upload.imageUrl,
    expiresAt: toSeoulTime(upload.expiresAt),
  }))
}
