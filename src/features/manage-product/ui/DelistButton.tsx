import { confirmAction } from '@/shared/lib'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useDelist } from '../model/use-manage-product'

type DelistButtonProps = { productId: string }

/** 판매자 등록 취소: 되돌릴 수 없어 확인을 받고, 요청 중에는 막는다 */
export function DelistButton({ productId }: DelistButtonProps) {
  const delist = useDelist(productId)
  return (
    <span className="flex items-center gap-2">
      <Button
        variant="outline"
        className="max-lg:h-11"
        disabled={delist.isPending}
        aria-busy={delist.isPending}
        onClick={async () => {
          if (
            await confirmAction({
              title: '이 상품을 등록 취소할까요?',
              description:
                '목록에서 빠지고 더는 팔 수 없어요. 판매자는 되돌릴 수 없고, 상품 정보 · 재고도 바꿀 수 없어요. 다시 팔려면 상품을 새로 등록해요.',
              confirmLabel: '등록 취소',
              tone: 'danger',
            })
          )
            delist.mutate()
        }}
      >
        등록 취소
      </Button>
      {delist.isError && <StateMessage tone="error">{getErrorMessage(delist.error)}</StateMessage>}
    </span>
  )
}
