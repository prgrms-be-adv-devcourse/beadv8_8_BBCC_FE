import { useState } from 'react'
import { ReturnWalletBalanceButton } from '@/features/return-wallet-balance'
import { useAdminWalletsQuery, type AdminWalletFilter } from '@/entities/wallet'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'
import { AdminWalletTable } from './AdminWalletTable'

const FILTERS: { key: keyof AdminWalletFilter; label: string }[] = [
  { key: 'frozenOnly', label: '동결된 지갑만' },
  { key: 'withBalanceOnly', label: '잔액 있는 지갑만' },
]

/** 관리자 지갑: 회원 예치금 지갑 목록 → 탈퇴로 동결된 지갑의 남은 잔액을 돌려줬다고 기록 */
export function AdminWalletsPage() {
  const [filter, setFilter] = useState<AdminWalletFilter>({
    frozenOnly: false,
    withBalanceOnly: false,
  })
  const [page, setPage] = useState(0)
  const wallets = useAdminWalletsQuery(filter, page)
  const rows = wallets.data?.content ?? []
  const toggleFilter = (key: keyof AdminWalletFilter) => {
    setFilter((current) => ({ ...current, [key]: !current[key] }))
    setPage(0)
  }

  return (
    <div className="shop-look max-w-4xl space-y-5">
      <PageHeader
        title="지갑"
        description="회원의 예치금 잔액을 봐요. 탈퇴로 동결된 지갑에 남은 잔액은 회원에게 돌려준 뒤 여기서 기록해요."
        note="GET /admin/wallets?frozen=&hasBalance= (BE #670), POST /admin/wallets/{walletId}/return-balance (BE #731): 송금 없이 환급 기록 + 잔액 0 + 원장 BALANCE_RETURN. 요청 금액이 지금 잔액과 다르면 409."
      />
      <section aria-label="지갑 목록" className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="text-ink-3 mr-auto text-[13px]">
            {wallets.data && <span className="figure">{wallets.data.totalElements}개</span>}
          </p>
          <div role="group" aria-label="거르기" className="flex gap-2">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter[key]}
                onClick={() => toggleFilter(key)}
                className={cn(
                  'border-rule inline-flex h-10 shrink-0 items-center rounded-md border px-4 text-sm font-semibold transition-colors max-lg:h-11',
                  filter[key] ? 'border-ink text-ink' : 'text-ink-2 hover:border-field-edge',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {wallets.isPending && <ListSkeleton />}
        {wallets.isError && (
          <StateMessage tone="error">{getErrorMessage(wallets.error)}</StateMessage>
        )}
        {wallets.data && rows.length === 0 && (
          <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
            조건에 맞는 지갑이 없어요.
          </p>
        )}
        {rows.length > 0 && (
          <AdminWalletTable
            wallets={rows}
            memberHref={paths.admin.member}
            action={(wallet) => <ReturnWalletBalanceButton wallet={wallet} />}
          />
        )}
        {wallets.data && (
          <Pagination
            page={wallets.data.page}
            totalPages={wallets.data.totalPages}
            onChange={setPage}
          />
        )}
      </section>
    </div>
  )
}
