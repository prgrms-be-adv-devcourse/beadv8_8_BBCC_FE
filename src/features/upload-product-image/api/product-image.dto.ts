// 실제 API(BE #373 진행 중): POST /seller/product-images/upload-urls. 머지 전에는 목으로 응답한다

/** 계약 값 (BE ProductImageFormat · ProductImageUpload). 서버가 같은 값으로 400을 낸다 */
export const PRODUCT_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
/** 한 장 최대 바이트 (10MB). 0바이트도 거절한다 */
export const PRODUCT_IMAGE_MAX_BYTES = 10 * 1024 * 1024
/** 한 번에 발급받을 수 있는 장수 = 상품 하나의 최대 장수 */
export const PRODUCT_IMAGE_MAX_COUNT = 10

/** POST /seller/product-images/upload-urls 요청. 실제로 올릴 파일(줄인 결과)의 형식 · 크기 */
export type ProductImageUploadUrlsRequestDto = {
  files: { contentType: string; contentLength: number }[]
}

/** 응답. 요청 순서대로. uploadUrl은 5분 안에 PUT을 시작해야 하고, imageUrl은 만료되지 않는다 */
export type ProductImageUploadUrlsDto = {
  uploads: { uploadUrl: string; imageUrl: string; expiresAt: string }[]
}
