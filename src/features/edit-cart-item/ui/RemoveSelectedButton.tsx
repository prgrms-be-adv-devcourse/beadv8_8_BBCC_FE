import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import { useRemoveCartItems } from '../model/use-edit-cart-item'

type RemoveSelectedButtonProps = { cartItemIds: string[] }

/** 장바구니 선택 삭제 */
export function RemoveSelectedButton({ cartItemIds }: RemoveSelectedButtonProps) {
  const remove = useRemoveCartItems()
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        disabled={cartItemIds.length === 0 || remove.isPending}
        onClick={async () => {
          if (
            await confirmAction({
              title: `${cartItemIds.length}개를 장바구니에서 뺄까요?`,
              confirmLabel: '빼기',
            })
          )
            remove.mutate(cartItemIds)
        }}
        className="text-muted-foreground hover:text-foreground text-sm underline disabled:no-underline disabled:opacity-40"
      >
        선택 삭제
      </button>
      {remove.isError && (
        <span className="text-destructive text-xs">{getErrorMessage(remove.error)}</span>
      )}
    </span>
  )
}
