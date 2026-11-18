import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useCompleteChildOnboarding } from '../model/use-complete-child-onboarding'

const NOTES = [
  { title: '내 정보', body: '보호자가 너의 이름과 키, 몸무게를 알려 줬어.' },
  { title: '어디에 쓰나요', body: '알맞은 옷을 추천하고 주문할 때 사용해.' },
  {
    title: '보호자가 보는 것',
    body: '보호자는 네 계정과 장바구니, 조르기, 주문 내역을 볼 수 있어.',
  },
] as const

export function ChildOnboarding() {
  const { notice } = useCompleteChildOnboarding()
  return (
    <section className="space-y-4">
      <PageHeader title="처음 만나요" description="Kidly를 쓰기 전에 꼭 알아 둘 것을 알려 줄게." />
      <div className="border-ink max-w-2xl space-y-5 border-[1.5px] p-5 md:p-6">
        <ul className="space-y-3">
          {NOTES.map((note) => (
            <li key={note.title} className="flex gap-3">
              <span aria-hidden className="bg-marker mt-1.5 size-2.5 shrink-0" />
              <span>
                <span className="block font-bold">{note.title}</span>
                <span className="text-ink-2 text-sm">{note.body}</span>
              </span>
            </li>
          ))}
        </ul>
        <Button disabled={notice.isPending} onClick={() => notice.mutate()}>
          확인
        </Button>
        {notice.isError && <p role="alert">{getErrorMessage(notice.error)}</p>}
      </div>
    </section>
  )
}
