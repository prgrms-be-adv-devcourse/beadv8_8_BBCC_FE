import { wishLineShape } from '@/entities/wish'
import { apiClient, expectShape } from '@/shared/api'
import type { AddChildWishItemRequestDto } from './child-wish-cart.dto'

export const childWishCartApi = {
  add: (body: AddChildWishItemRequestDto) =>
    apiClient.post('/child/wish/items', body).then(expectShape(wishLineShape)),
  remove: (id: string) => apiClient.delete(`/child/wish/items/${id}`),
}
