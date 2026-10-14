import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { cartKeys } from '@/entities/cart'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/page-header'

type Props = {
  optionId: string | null
  /** 입을 자녀 (선택). 상세에서 고른 자녀를 그대로 넘긴다 */
  childId: number | null
  quantity: number
  disabled?: boolean
}

export function AddToCartButton({ optionId, childId, quantity, disabled }: Props) {
  const queryClient = useQueryClient()

  const add = useMutation({
    mutationFn: () =>
      runWithAction('장바구니 담기', () =>
        apiClient.post('/cart/items', { optionId: Number(optionId), childId, quantity }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.mine }),
  })

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={disabled || !optionId || add.isPending}
        onClick={() => add.mutate()}
      >
        장바구니 담기
      </Button>
      {add.isError && <StateMessage tone="error">{getErrorMessage(add.error)}</StateMessage>}
      {add.isSuccess && (
        <StateMessage>
          담았어요.{' '}
          <Link to="/cart" className="text-primary underline">
            장바구니 보기
          </Link>
        </StateMessage>
      )}
    </div>
  )
}
