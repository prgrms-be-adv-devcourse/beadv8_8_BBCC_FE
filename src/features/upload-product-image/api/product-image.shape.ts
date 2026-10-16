import { arr, obj, str } from '@/shared/api'

export const productImageUploadUrlsShape = obj({
  uploads: arr(obj({ uploadUrl: str, imageUrl: str, expiresAt: str })),
})
