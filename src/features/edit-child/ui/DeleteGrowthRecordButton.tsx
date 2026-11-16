import { type GrowthRecord } from '@/entities/child'
import { getErrorMessage } from '@/shared/api'
import { confirmAction, formatDateTime } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useDeleteGrowthRecord } from '../model/use-edit-child'

type DeleteGrowthRecordButtonProps = {
  childId: string
  record: GrowthRecord
  deletable: boolean
}

export function DeleteGrowthRecordButton({
  childId,
  record,
  deletable,
}: DeleteGrowthRecordButtonProps) {
  const remove = useDeleteGrowthRecord(childId)
  return (
    <div>
      <Button
        variant="destructive"
        size="sm"
        disabled={!deletable || remove.isPending}
        onClick={async () => {
          if (
            await confirmAction({
              title: `${formatDateTime(record.recordedAt)} · ${record.heightCm}cm 기록을 삭제할까요?`,
              confirmLabel: '삭제',
              tone: 'danger',
            })
          )
            remove.mutate(record.id)
        }}
      >
        삭제
      </Button>
      {!deletable && (
        <p className="text-muted-foreground text-xs">기록이 하나뿐이면 지울 수 없어요.</p>
      )}
      {remove.isError && <StateMessage tone="error">{getErrorMessage(remove.error)}</StateMessage>}
    </div>
  )
}
