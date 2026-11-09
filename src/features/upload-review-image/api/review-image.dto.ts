// 실제 API(BE community ReviewImageController): POST /reviews/images/upload-urls (로그인 회원)

/** 계약 값 (BE ReviewImageUpload · community.yml max-file-size 10MB). 서버가 같은 값으로 400을 낸다 */
export const REVIEW_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const REVIEW_IMAGE_MAX_BYTES = 10 * 1024 * 1024

/** 요청 (BE ReviewImageUploadRequest). 실제로 올릴 파일(줄인 결과)의 형식 · 크기 */
export type ReviewImageUploadRequestDto = {
  files: { contentType: string; contentLength: number }[]
}

/**
 * 응답 (BE ReviewImageUploadResponse). 요청 순서대로. uploadUrl로 PUT 하고(요청한 형식 · 크기 그대로),
 * imageUrl을 리뷰 작성 · 수정의 imageUrls에 넣는다. expiresAt은 서울 시간(시간대 없음)
 */
export type ReviewImageUploadDto = {
  files: { uploadUrl: string; imageUrl: string; expiresAt: string }[]
}
