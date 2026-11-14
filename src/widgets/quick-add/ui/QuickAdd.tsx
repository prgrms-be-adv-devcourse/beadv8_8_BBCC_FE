import { useState } from 'react'
import { ModalSheet } from '@/shared/ui/ModalSheet'
import { QuickAddPanel } from './QuickAddPanel'

type QuickAddProps = {
  productId: string
  productName: string
  /** 팝업을 열 때 고른 채로 시작할 자녀 (맞춤 목록처럼 자녀가 정해진 자리). 없으면 선택 안 함 */
  childId?: string | null
}

/** 상품 칸의 「담기」: 누르면 옵션을 고르는 팝업(넓은 화면은 가운데 창, 휴대폰은 아래 시트)이 뜬다 */
export function QuickAdd({ productId, productName, childId = null }: QuickAddProps) {
  const [isOpen, setIsOpen] = useState(false)
  const handleClose = () => setIsOpen(false)
  return (
    <>
      <button
        type="button"
        aria-label={`${productName} 담기`}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        className="border-ink bg-paper text-ink hover:bg-marker inline-flex h-10 items-center border-[1.5px] px-2.5 text-[13px] font-bold transition-colors"
      >
        담기
      </button>
      {/* 열 때만 상품을 불러온다 (닫혀 있는 칸마다 상세를 부르지 않게) */}
      {isOpen && (
        <ModalSheet title="옵션 고르고 담기" open onClose={handleClose}>
          <QuickAddPanel productId={productId} initialChildId={childId} onClose={handleClose} />
        </ModalSheet>
      )}
    </>
  )
}
