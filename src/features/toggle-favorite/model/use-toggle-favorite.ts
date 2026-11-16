import { useMutation, useQueryClient } from '@tanstack/react-query'
import { favoriteKeys, type FavoriteOwnerPrincipal } from '@/entities/favorite'
import { getErrorMessage, runWithAction } from '@/shared/api'
import { toast } from '@/shared/lib'
import { toggleFavoriteApi } from '../api/toggle-favorite-api'

/**
 * 찜하기 · 찜 취소 (보호자 회원 또는 자녀 본인). 끝나면(실패해도) 찜 수 · 찜 여부 · 내 찜을 다시 부른다.
 * 실패는 서버 문구를 그대로 알린다 (지워진 자녀 계정은 403 안내)
 */
export function useToggleFavorite(productId: string, owner: FavoriteOwnerPrincipal = 'member') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (shouldFavorite: boolean) =>
      shouldFavorite
        ? runWithAction('찜하기', () => toggleFavoriteApi.add(productId, owner))
        : runWithAction('찜 취소', () => toggleFavoriteApi.remove(productId, owner)),
    onError: (error) => toast(getErrorMessage(error), { tone: 'error' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoriteKeys.all }),
  })
}
