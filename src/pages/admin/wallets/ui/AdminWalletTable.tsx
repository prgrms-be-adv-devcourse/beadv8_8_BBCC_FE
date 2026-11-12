import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { AdminWallet } from '@/entities/wallet'
import { formatDateTime, formatWon } from '@/shared/lib'

type AdminWalletTableProps = {
  wallets: AdminWallet[]
  memberHref: (memberId: string) => string
  /** 줄마다 붙일 행동 (잔액 돌려주기) */
  action: (wallet: AdminWallet) => ReactNode
}

const HEAD = 'py-2.5 pr-4 font-medium whitespace-nowrap last:pr-0'
const CELL = 'py-3 pr-4 whitespace-nowrap'

/** 지갑 표: 지갑 · 회원 · 잔액 · 상태(사용 중 · 동결) · 행동. 좁으면 표 안에서 옆으로 민다 */
export function AdminWalletTable({ wallets, memberHref, action }: AdminWalletTableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-label="지갑" className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr className="border-rule text-ink-3 border-b text-[13px]">
            <th scope="col" className={HEAD}>
              지갑
            </th>
            <th scope="col" className={HEAD}>
              회원
            </th>
            <th scope="col" className={`${HEAD} text-right`}>
              잔액
            </th>
            <th scope="col" className={HEAD}>
              상태
            </th>
            <th scope="col" className={HEAD}>
              <span className="sr-only">행동</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-rule border-rule divide-y border-b">
          {wallets.map((wallet) => (
            <tr key={wallet.id} aria-label={`지갑 ${wallet.id}`} className="align-middle">
              <td className={`${CELL} figure font-semibold`}>{`지갑 ${wallet.id}`}</td>
              <td className={CELL}>
                <Link
                  to={memberHref(wallet.memberId)}
                  className="figure text-ink-2 hover:text-ink underline-offset-4 transition-colors hover:underline"
                >
                  {`회원 ${wallet.memberId}`}
                </Link>
              </td>
              <td className={`${CELL} figure text-right font-semibold`}>
                {formatWon(wallet.balance)}
              </td>
              <td className={`${CELL} text-ink-2`}>
                {wallet.frozenAt === null ? (
                  '사용 중'
                ) : (
                  <span>
                    동결
                    <span className="figure text-ink-3 ml-2 text-[13px]">
                      {formatDateTime(wallet.frozenAt)}
                    </span>
                  </span>
                )}
              </td>
              <td className="py-3">{action(wallet)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
