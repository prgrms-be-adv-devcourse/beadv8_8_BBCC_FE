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

export function toUploadTargets(dto: ProductImageUploadUrlsDto): UploadTarget[] {
  return dto.uploads.map((upload) => ({
    uploadUrl: upload.uploadUrl,
    imageUrl: upload.imageUrl,
    expiresAt: upload.expiresAt,
  }))
}
