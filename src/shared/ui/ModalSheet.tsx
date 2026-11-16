import { useState, type ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { cn } from '@/shared/lib'

type ModalSheetProps = {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

/**
 * 겹쳐 뜨는 창: 넓은 화면은 가운데 창, 휴대폰은 아래에서 올라오는 시트.
 * Esc · 바깥을 누르면 닫히고, 열려 있는 동안 초점을 안에 가두고 뒤 화면을 스크롤하지 않는다.
 * 연 자리의 영역(data-area) 안에 그려서 그 영역의 색 · 글자를 따른다
 */
export function ModalSheet({ title, open, onClose, children, className }: ModalSheetProps) {
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null)
  const container = anchor?.closest<HTMLElement>('[data-area]') ?? undefined
  return (
    <>
      <span ref={setAnchor} hidden />
      <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
        <Dialog.Portal container={container}>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Content
            aria-describedby={undefined}
            className={cn(
              'bg-paper text-ink border-ink fixed z-50 flex flex-col border-[1.5px] focus:outline-none',
              'max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[88svh] max-md:border-x-0 max-md:border-b-0',
              'md:top-1/2 md:left-1/2 md:max-h-[86svh] md:w-[min(56rem,calc(100vw-3rem))] md:-translate-x-1/2 md:-translate-y-1/2',
              className,
            )}
          >
            <div className="border-ink flex shrink-0 items-center justify-between gap-4 border-b-[1.5px] py-2 pr-2 pl-4 md:pl-6">
              <Dialog.Title className="text-base font-bold">{title}</Dialog.Title>
              <Dialog.Close
                aria-label="닫기"
                className="hover:bg-fit-soft flex size-10 items-center justify-center text-lg"
              >
                ✕
              </Dialog.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
