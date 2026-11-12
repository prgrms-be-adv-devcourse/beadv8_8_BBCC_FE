import { useMutation, useQueryClient } from '@tanstack/react-query'
import { favoriteKeys } from '@/entities/favorite'
import { getErrorMessage, runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { toggleFavoriteApi } from '../api/toggle-favorite-api'

/** 찜하기 · 찜 취소. 끝나면(실패해도) 찜 수 · 찜 여부 · 내 찜을 다시 부른다 */
export function useToggleFavorite(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (shouldFavorite: boolean) =>
      shouldFavorite
        ? runWithAction('찜하기', () => toggleFavoriteApi.add(productId))
        : runWithAction('찜 취소', () => toggleFavoriteApi.remove(productId)),
    onError: (error) => toast(getErrorMessage(error), { tone: 'error' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoriteKeys.all }),
  })
}
