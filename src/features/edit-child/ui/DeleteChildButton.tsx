import { confirmAction } from '@/shared/lib'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useDeleteChild } from '../model/use-edit-child'

type DeleteChildButtonProps = {
  childId: string
  childName: string
  onDeleted: () => void
}

export function DeleteChildButton({ childId, childName, onDeleted }: DeleteChildButtonProps) {
  const remove = useDeleteChild(childId, { onDeleted })
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        size="sm"
        disabled={remove.isPending}
        onClick={async () => {
          if (
            await confirmAction({
              title: `${childName} 프로필을 삭제할까요?`,
              description: '지난 주문의 자녀 정보는 남아요.',
              confirmLabel: '삭제',
              tone: 'danger',
            })
          )
            remove.mutate()
        }}
      >
        자녀 삭제
      </Button>
      {remove.isError && <StateMessage tone="error">{getErrorMessage(remove.error)}</StateMessage>}
    </div>
  )
}
