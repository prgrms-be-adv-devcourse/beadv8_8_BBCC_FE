import { getErrorMessage } from '@/shared/api'
import { confirmAction, type ConfirmOptions } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useHandleOrderFailure, type OrderFailureAction } from '../model/use-handle-order-failure'

type OrderFailureActionButtonProps = {
  action: OrderFailureAction
  id: string
  label: string
  confirm: ConfirmOptions
  variant?: 'outline' | 'destructive'
}

/** 확인 창 → 요청(요청 중 버튼 막기) → 실패면 detail 그대로 */
export function OrderFailureActionButton({
  action,
  id,
  label,
  confirm,
  variant = 'outline',
}: OrderFailureActionButtonProps) {
  const { run, pending, error } = useHandleOrderFailure(action, id)
  async function handleClick() {
    if (await confirmAction(confirm)) run()
  }
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        variant={variant}
        className="h-9 rounded-md px-3"
        disabled={pending}
        onClick={handleClick}
      >
        {label}
      </Button>
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
    </span>
  )
}
