import { obj, str } from '@/shared/api'

export const reviewVisibilityShape = obj({ reviewId: str, status: str })
