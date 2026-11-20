import { getErrorMessage } from '@/shared/api'
import { cn } from '@/shared/lib'
import { useCompleteChildOnboarding } from '../model/use-complete-child-onboarding'

const NOTES = [
  {
    title: '내 정보',
    body: '보호자가 너의 이름과 키, 몸무게를 알려 줬어.',
    look: 'bg-sheet -rotate-[0.8deg] md:-rotate-1',
  },
  {
    title: '어디에 쓰나요',
    body: '알맞은 옷을 추천하고 주문할 때 사용해.',
    look: 'bg-marker rotate-[0.6deg] md:rotate-[0.8deg]',
  },
  {
    title: '보호자가 보는 것',
    body: '보호자는 네 계정과 장바구니, 조르기, 주문 내역을 볼 수 있어.',
    look: 'bg-paper -rotate-[0.4deg] md:-rotate-[0.5deg]',
  },
] as const

type ChildOnboardingProps = {
  /** 반가워 인사에 넣을 이름. 모르면 인사만 */
  name?: string | null
}

export function ChildOnboarding({ name }: ChildOnboardingProps) {
  const { notice } = useCompleteChildOnboarding()
  return (
    <section className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-6 px-5 pt-7 pb-6 text-center md:gap-12 md:px-8 md:py-[72px]">
      <div className="flex flex-col items-center gap-3">
        <p className="font-hand text-2xl font-bold md:text-[28px]">
          {name ? `반가워, ${name}!` : '반가워!'}
        </p>
        <h1 className="font-display text-[52px] leading-none md:text-[88px]">처음 만나요</h1>
        <p className="text-sm leading-relaxed md:text-[17px]">
          옷장을 열기 전에 세 가지만 알려 줄게.
        </p>
      </div>
      <ol className="grid w-full gap-3 text-left md:grid-cols-3 md:gap-6">
        {NOTES.map((note, index) => (
          <li
            key={note.title}
            className={cn(
              'border-ink flex items-start gap-3.5 border-2 px-4 py-3.5 md:flex-col md:p-7',
              note.look,
            )}
          >
            <span
              aria-hidden
              className="border-ink bg-paper font-display flex size-10 shrink-0 items-center justify-center border-2 text-[22px] md:size-[52px] md:text-[28px]"
            >
              {index + 1}
            </span>
            <div className="flex flex-col gap-1 md:gap-3.5">
              <h2 className="font-display text-xl md:text-[28px]">{note.title}</h2>
              <p className="text-sm leading-relaxed md:text-base md:leading-[1.7]">{note.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex w-full flex-col items-center gap-3">
        <button
          type="button"
          disabled={notice.isPending}
          aria-busy={notice.isPending}
          onClick={() => notice.mutate()}
          className="shop-btn min-h-[60px] w-full px-9 text-lg md:w-auto"
        >
          알겠어, 옷장 열기 <span aria-hidden>→</span>
        </button>
        <p className="text-[13px]">이 안내는 처음 한 번만 나와.</p>
        {notice.isError && <p role="alert">{getErrorMessage(notice.error)}</p>}
      </div>
    </section>
  )
}
