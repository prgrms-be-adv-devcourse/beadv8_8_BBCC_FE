import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/entities/cart'
import { wishKeys } from '@/entities/wish'
import { runWithAction } from '@/shared/api'
import { sendChildWish } from '../api/send-child-wish-api'
import { toChildWishRequest } from './child-wish.mapper'

export function useSendChildWish() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, message }: { ids: string[]; message: string }) =>
      runWithAction('조르기 보내기', () => sendChildWish(toChildWishRequest(ids, message))),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: cartKeys.child }),
        client.invalidateQueries({ queryKey: wishKeys.childRequests }),
      ])
    },
  })
}
