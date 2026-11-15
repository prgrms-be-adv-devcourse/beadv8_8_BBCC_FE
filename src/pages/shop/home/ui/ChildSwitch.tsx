import { useState } from 'react'
import { Link } from 'react-router'
import { DropdownMenu } from 'radix-ui'
import type { Child } from '@/entities/child'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { ModalSheet } from '@/shared/ui/ModalSheet'

type ChildSwitchProps = {
  kids: Child[]
  child: Child
  onSelect: (childId: string) => void
}

const NAME = 'font-hand text-[3.25rem] leading-[0.9] font-bold lg:text-[3.75rem]'
const TRIGGER =
  'hover:bg-marker focus-visible:bg-marker -mx-1 items-baseline gap-1.5 px-1 text-left transition-colors focus-visible:outline-none'
const ROW = 'flex w-full items-center gap-3 px-4 py-2.5 text-left'

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px] shrink-0 self-center"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function ChildRow({ kid, isCurrent }: { kid: Child; isCurrent: boolean }) {
  return (
    <>
      <span className="font-hand flex-1 text-2xl leading-none font-bold">{kid.name}</span>
      <span className="figure text-sm font-bold">{kid.heightCm}cm</span>
      <span aria-hidden className="w-4 text-sm font-extrabold">
        {isCurrent ? '✓' : ''}
      </span>
    </>
  )
}

/**
 * 태그에 손글씨로 적힌 자녀 이름. 자녀가 둘 이상이면 이름이 곧 전환 버튼이다:
 * 넓은 화면은 이름 바로 아래로 목록이 펼쳐지고, 휴대폰은 같은 목록이 아래 시트로 뜬다.
 * 자녀가 많아도 목록 안에서만 스크롤한다
 */
export function ChildSwitch({ kids, child, onSelect }: ChildSwitchProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  if (kids.length < 2) return <span className={NAME}>{child.name}</span>

  const label = `자녀 바꾸기, 지금 ${child.name}`
  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger aria-label={label} className={cn(TRIGGER, 'hidden md:inline-flex')}>
          <span className={NAME}>{child.name}</span>
          <Chevron />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={8}
            data-area="shop"
            data-clarity-mask="true"
            className="bg-paper text-ink border-ink z-50 w-60 border-[1.5px] shadow-[5px_6px_0_var(--shop-ink)]"
          >
            <DropdownMenu.RadioGroup
              value={child.id}
              onValueChange={onSelect}
              className="max-h-64 overflow-y-auto"
            >
              {kids.map((kid) => (
                <DropdownMenu.RadioItem
                  key={kid.id}
                  value={kid.id}
                  className={cn(
                    ROW,
                    'data-[highlighted]:bg-fit-soft cursor-pointer focus:outline-none',
                    kid.id === child.id && 'bg-marker',
                  )}
                >
                  <ChildRow kid={kid} isCurrent={kid.id === child.id} />
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
            <DropdownMenu.Item asChild>
              <Link
                to={paths.shop.childNew}
                className="border-ink data-[highlighted]:bg-fit-soft block border-t-[1.5px] px-4 py-2.5 text-[13px] font-bold focus:outline-none"
              >
                + 자녀 등록
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <button
        type="button"
        aria-label={label}
        onClick={() => setIsSheetOpen(true)}
        className={cn(TRIGGER, 'inline-flex md:hidden')}
      >
        <span className={NAME}>{child.name}</span>
        <Chevron />
      </button>
      <ModalSheet
        title="누구 옷을 볼까요?"
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      >
        <ul data-clarity-mask="true">
          {kids.map((kid) => (
            <li key={kid.id}>
              <button
                type="button"
                aria-current={kid.id === child.id}
                onClick={() => {
                  onSelect(kid.id)
                  setIsSheetOpen(false)
                }}
                className={cn(ROW, 'min-h-12', kid.id === child.id && 'bg-marker')}
              >
                <ChildRow kid={kid} isCurrent={kid.id === child.id} />
              </button>
            </li>
          ))}
        </ul>
        <Link
          to={paths.shop.childNew}
          className="border-ink block border-t-[1.5px] px-4 py-3.5 text-[13px] font-bold"
        >
          + 자녀 등록
        </Link>
      </ModalSheet>
    </>
  )
}
