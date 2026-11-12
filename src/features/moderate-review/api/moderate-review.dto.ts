/** PATCH /admin/community/reviews/{reviewId}/visibility 요청 (BE ReviewVisibilityRequest) */
export type ReviewVisibilityRequestDto = { visibility: 'HIDDEN' | 'VISIBLE' }

/** 200 응답 (BE ReviewVisibilityResponse). status는 CONFIRMED_HIDDEN · RESTORED. 같은 값을 다시 보내도 200 */
export type ReviewVisibilityDto = { reviewId: string; status: string }
