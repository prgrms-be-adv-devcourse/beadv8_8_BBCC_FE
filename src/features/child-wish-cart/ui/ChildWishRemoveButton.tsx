import { getErrorMessage } from '@/shared/api'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useChildWishCart } from '../model/use-child-wish-cart'

type ChildWishRemoveButtonProps = {
  id: string
  disabled: boolean
  /** 어떤 줄을 빼는지 읽어 줄 이름 (예: 「데일리 맨투맨 네이비 / 110」) */
  label: string
}
export function ChildWishRemoveButton({ id, disabled, label }: ChildWishRemoveButtonProps) {
  const { remove } = useChildWishCart()
  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        aria-label={`${label} 빼기`}
        disabled={disabled || remove.isPending}
        onClick={() => remove.mutate(id)}
        className="text-ink min-h-11 px-1 text-sm font-bold underline underline-offset-[3px] disabled:opacity-50"
      >
        빼기
      </button>
      {remove.isError && <StateMessage tone="error">{getErrorMessage(remove.error)}</StateMessage>}
    </div>
  )
}
