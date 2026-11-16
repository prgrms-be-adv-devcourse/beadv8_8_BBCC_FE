/** POST /admin/community/reviews/moderation/retry-exhausted 200 응답 (BE #1310). 다시 검사 대기로 돌린 리뷰 수 */
export type RetryExhaustedDto = { resetCount: number }
