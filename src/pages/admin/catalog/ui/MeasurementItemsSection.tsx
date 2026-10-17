import { useMeasurementItemsQuery } from '@/entities/catalog'
import { CreateMeasurementItemForm } from '@/features/manage-catalog'
import { getErrorMessage } from '@/shared/api'
import { Card, CardTitle } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 실측 항목: 만들기 폼 + 목록 */
export function MeasurementItemsSection() {
  const items = useMeasurementItemsQuery()

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>실측 항목 만들기</CardTitle>
        <CreateMeasurementItemForm />
      </Card>
      {items.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {items.isError && <StateMessage tone="error">{getErrorMessage(items.error)}</StateMessage>}
      {items.data?.length === 0 && <StateMessage>실측 항목이 없어요.</StateMessage>}
      {items.data && items.data.length > 0 && (
        <Card className="divide-y p-0 text-sm">
          {items.data.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2">
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">{item.code}</span>
              <span className="ml-auto">{item.unit}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
