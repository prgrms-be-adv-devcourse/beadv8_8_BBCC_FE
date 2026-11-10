import { getErrorMessage } from '@/shared/api'
import { confirmAction } from '@/shared/lib'
import {
  catalogKindObject,
  useDeleteCatalogItem,
  type CatalogDeleteTarget,
} from '../model/use-delete-catalog'

type DeleteCatalogButtonProps = {
  target: CatalogDeleteTarget
  /** 확인 창과 버튼 이름에 쓰는 대상 이름 */
  name: string
  onDeleted?: () => void
}

/**
 * 기준 데이터 지우기: 확인을 받고 요청 중에는 막는다. 다른 기준 데이터가 쓰고 있는지는 화면이 다 알 수 없어
 * 미리 막지 않고, 거절(409) 설명을 버튼 옆에 그대로 보여 준다
 */
export function DeleteCatalogButton({ target, name, onDeleted }: DeleteCatalogButtonProps) {
  const remove = useDeleteCatalogItem(target)
  const object = catalogKindObject(target.kind)

  const handleClick = async () => {
    const isConfirmed = await confirmAction({
      title: `「${name}」 ${object} 지울까요?`,
      description: '지우면 목록에서 빠지고 새로 연결할 수 없어요.',
      confirmLabel: '삭제',
      tone: 'danger',
    })
    if (isConfirmed) remove.mutate(undefined, { onSuccess: () => onDeleted?.() })
  }

  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-2">
      <button
        type="button"
        aria-label={`${name} 삭제`}
        disabled={remove.isPending}
        aria-busy={remove.isPending}
        onClick={handleClick}
        className="text-destructive inline-flex min-h-10 items-center text-[13px] font-semibold hover:underline disabled:opacity-50"
      >
        삭제
      </button>
      {remove.isError && (
        <span role="alert" className="text-destructive text-[13px]">
          {getErrorMessage(remove.error)}
        </span>
      )}
    </span>
  )
}
