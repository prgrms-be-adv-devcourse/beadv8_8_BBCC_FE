import { arr, obj, str } from '@/shared/api'

export const reviewImageUploadShape = obj({
  files: arr(obj({ uploadUrl: str, imageUrl: str, expiresAt: str })),
})
