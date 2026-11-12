import { arr, bool, nullable, num, obj, str } from '@/shared/api'

// BE ChatController · ChatResponse (#1191)
export const chatResponseShape = obj({
  answer: str,
  sources: arr(obj({ documentId: num, title: str })),
  products: arr(
    obj({
      productId: num,
      name: str,
      businessName: nullable(str),
      price: num,
      thumbnailUrl: nullable(str),
      soldOut: bool,
    }),
  ),
})
