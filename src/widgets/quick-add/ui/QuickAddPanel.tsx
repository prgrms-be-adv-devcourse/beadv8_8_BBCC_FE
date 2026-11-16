import { useProductQuery } from '@/entities/product'
import { getErrorMessage } from '@/shared/api'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { QuickAddForm } from './QuickAddForm'

type QuickAddPanelProps = {
  productId: string
  initialChildId: string | null
  onClose: () => void
}

/** 담기 팝업 내용: 상품 상세를 불러와 옵션 고르기 화면을 그린다 */
export function QuickAddPanel({ productId, initialChildId, onClose }: QuickAddPanelProps) {
  const product = useProductQuery(productId)
  if (product.isPending)
    return (
      <div
        role="status"
        aria-label="불러오는 중"
        className="grid gap-6 p-4 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:p-6"
      >
        <Skeleton className="aspect-[4/5] max-md:hidden" />
        <div className="space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  if (product.isError)
    return (
      <div className="p-4 md:p-6">
        <StateMessage tone="error">{getErrorMessage(product.error)}</StateMessage>
      </div>
    )
  return <QuickAddForm detail={product.data} initialChildId={initialChildId} onClose={onClose} />
}
