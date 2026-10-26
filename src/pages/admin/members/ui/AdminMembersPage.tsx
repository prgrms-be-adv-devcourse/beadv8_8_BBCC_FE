import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import {
  MEMBER_FILTER_LABEL,
  memberFilterOf,
  useAdminMembersQuery,
  type MemberFilter,
} from '@/entities/member'
import { getErrorMessage } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import { cn, useArea } from '@/shared/lib'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { MemberTable } from './MemberTable'

const FILTERS = Object.keys(MEMBER_FILTER_LABEL) as MemberFilter[]

/** 회원 관리(목록): 구분 탭 → 검색 → 회원 표. 정지 · 권한 변경은 회원 상세에서 */
export function AdminMembersPage() {
  const adminPaths = adminPathsOf(useArea())
  // 구분 · 검색어는 주소(?filter= · ?q=)에 둔다 → 상세에서 돌아와도 그대로
  const [params, setParams] = useSearchParams()
  const filter = memberFilterOf(params.get('filter'))
  const search = params.get('q') ?? ''
  const members = useAdminMembersQuery(filter, search)
  const setParam = (key: 'filter' | 'q', value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const keyword = new FormData(event.currentTarget).get('q')
    setParam('q', typeof keyword === 'string' ? keyword.trim() || null : null)
  }

  const rows = members.data?.content ?? []

  return (
    <div className="shop-look space-y-5">
      <PageHeader
        title="회원 관리"
        description="회원을 찾아 상세에서 이용 정지 · 판매자 자격 정지 · 관리자 지정을 해요. 관리자는 관리자 탭에서만 보이고 탈퇴 회원은 보이지 않아요."
        note="이용 정지 → 로그인 · 재발급 막힘. 판매자 자격 정지 → seller.changed (정지 후 상품 처리는 보류, 기획서 2.1). 관리자 지정 · 해제 → 다음 토큰 재발급부터 ADMIN 역할 반영 (BE #356)"
      />
      <div
        role="tablist"
        aria-label="회원 구분"
        className="border-rule flex gap-6 overflow-x-auto border-b"
      >
        {FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setParam('filter', key === 'ALL' ? null : key)}
            className={cn(
              '-mb-px flex min-h-11 shrink-0 items-center border-b-2 text-[15px] font-bold transition-colors',
              filter === key
                ? 'border-ink text-ink'
                : 'text-ink-3 hover:text-ink active:text-ink border-transparent',
            )}
          >
            {MEMBER_FILTER_LABEL[key]}
          </button>
        ))}
      </div>

      <section aria-label="회원 목록" className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <h2 className="text-section mr-auto">
            {MEMBER_FILTER_LABEL[filter]} 회원
            {members.data && (
              <span className="figure text-ink-3 ml-2 text-sm font-medium">
                {members.data.totalElements}명
              </span>
            )}
          </h2>
          {/* 검색어가 바뀌면(뒤로 가기 등) 입력 칸도 주소 값으로 다시 그린다 */}
          <form key={search} className="flex w-full gap-2 sm:w-auto" onSubmit={handleSearch}>
            <Input
              name="q"
              aria-label="회원 검색"
              placeholder="회원 번호 · 닉네임 · 이메일"
              className="h-10 min-w-0 flex-1 sm:w-64"
              defaultValue={search}
            />
            <button
              type="submit"
              className="border-rule text-ink-2 hover:border-field-edge inline-flex h-10 shrink-0 items-center rounded-md border px-4 text-sm font-semibold transition-colors max-lg:h-11"
            >
              검색
            </button>
          </form>
        </div>

        {members.isPending && <ListSkeleton />}
        {members.isError && (
          <StateMessage tone="error">{getErrorMessage(members.error)}</StateMessage>
        )}
        {members.data && rows.length === 0 && (
          <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
            {search ? '검색어에 맞는 회원이 없어요.' : '이 구분의 회원이 없어요.'}
          </p>
        )}
        {rows.length > 0 && (
          <MemberTable
            members={rows}
            memberHref={adminPaths.member}
            listSearch={params.toString()}
          />
        )}
      </section>
    </div>
  )
}
