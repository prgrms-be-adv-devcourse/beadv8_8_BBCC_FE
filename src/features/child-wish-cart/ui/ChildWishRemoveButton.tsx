import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useChildWishCart } from '../model/use-child-wish-cart'

type ChildWishRemoveButtonProps = { id: string; disabled: boolean }
export function ChildWishRemoveButton({ id, disabled }: ChildWishRemoveButtonProps) {
  const { remove } = useChildWishCart()
  return (
    <div>
      <Button disabled={disabled || remove.isPending} onClick={() => remove.mutate(id)}>
        빼기
      </Button>
      {remove.isError && <StateMessage tone="error">{getErrorMessage(remove.error)}</StateMessage>}
    </div>
  )
}
