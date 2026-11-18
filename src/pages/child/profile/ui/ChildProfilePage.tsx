import { Link } from 'react-router'
import { ChildCard, useOwnChildProfileQuery } from '@/entities/child'
import { getErrorMessage, getErrorStatus } from '@/shared/api'
import { paths } from '@/shared/config'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 프로필 옆 빈자리: 자녀가 자주 가는 화면 바로가기 */
const SHORTCUTS = [
  { to: paths.child.products, label: '옷 구경하기', hint: '내 키에 맞는 사이즈를 알려 줘요' },
  { to: paths.child.cart, label: '담은 옷 보기', hint: '담은 옷을 보호자에게 조를 수 있어요' },
  { to: paths.child.wishes, label: '조르기 결과 보기', hint: '보낸 조르기 결과를 봐요' },
  { to: paths.child.purchases, label: '사 준 옷 보기', hint: '보호자가 사 준 옷이에요' },
] as const

export function ChildProfilePage() {
  const profile = useOwnChildProfileQuery()
  if (profile.isPending) return <StateMessage>불러오는 중…</StateMessage>
  if (profile.isError)
    return (
      <StateMessage tone="error">
        {getErrorStatus(profile.error) === 404
          ? '아직 보호자가 연결한 프로필이 없어요.'
          : getErrorMessage(profile.error)}
      </StateMessage>
    )
  return (
    <div className="space-y-6">
      <PageHeader
        title="내 프로필"
        description="보호자가 알려 준 내 정보예요. 키가 자라면 보호자에게 알려 줘."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,32rem)_1fr]">
        <ChildCard child={profile.data} />
        <nav aria-label="바로가기" className="grid content-start gap-3 sm:grid-cols-2">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="border-ink hover:bg-marker block border-[1.5px] p-4 transition-colors"
            >
              <span className="block font-bold">{item.label}</span>
              <span className="text-ink-2 mt-1 block text-[13px]">{item.hint}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
