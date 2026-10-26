import { Link } from 'react-router'
import { MEMBER_STATUS_LABEL, type AdminMember } from '@/entities/member'
import { SELLER_STATUS_LABEL } from '@/entities/seller'
import { cn, formatDateTime } from '@/shared/lib'

type MemberTableProps = {
  members: AdminMember[]
  memberHref: (id: string) => string
  /** 상세에서 목록으로 돌아올 때 지금 구분 · 검색어를 되살린다 */
  listSearch: string
}

type CellLabelProps = { children: string }

/** 휴대폰에서 칸 앞에 붙이는 라벨 (넓은 화면은 표 머리가 대신한다) */
function CellLabel({ children }: CellLabelProps) {
  return <span className="text-ink-3 text-[13px] lg:hidden">{children}</span>
}

// 휴대폰: 행을 묶음으로 다시 쌓는다. 첫 줄은 닉네임 · 상태, 그 아래 라벨 붙은 칸
const stackedCell =
  'max-lg:col-span-2 max-lg:grid max-lg:grid-cols-[4.5rem_minmax(0,1fr)] max-lg:gap-2 max-lg:py-0.5'

/** 회원 표: 닉네임(상세 링크) · 회원 번호 · 이메일 · 상태 · 판매자 · 가입일. 상태 글자는 회색, 정지만 빨강 */
export function MemberTable({ members, memberHref, listSearch }: MemberTableProps) {
  return (
    <div className="lg:overflow-x-auto">
      <table aria-label="회원" className="w-full text-left text-sm max-lg:block">
        <thead className="max-lg:hidden">
          <tr className="border-rule text-ink-3 border-b text-[13px]">
            <th scope="col" className="py-2.5 pr-4 font-medium">
              닉네임
            </th>
            <th scope="col" className="py-2.5 pr-4 font-medium">
              회원 번호
            </th>
            <th scope="col" className="py-2.5 pr-4 font-medium">
              이메일
            </th>
            <th scope="col" className="py-2.5 pr-4 font-medium">
              상태
            </th>
            <th scope="col" className="py-2.5 pr-4 font-medium">
              판매자
            </th>
            <th scope="col" className="py-2.5 font-medium">
              가입일
            </th>
          </tr>
        </thead>
        <tbody className="max-lg:block">
          {members.map((member) => (
            <tr
              key={member.id}
              className="border-rule border-b max-lg:grid max-lg:grid-cols-[minmax(0,1fr)_auto] max-lg:gap-x-2 max-lg:py-3 lg:align-middle"
            >
              <td className="py-3 pr-4 max-lg:col-start-1 max-lg:row-start-1 max-lg:self-center max-lg:py-0">
                <Link
                  to={memberHref(member.id)}
                  state={{ listSearch }}
                  className="text-ink hover:text-signal active:text-signal-deep inline-flex items-center font-semibold transition-colors max-lg:min-h-11"
                >
                  {member.nickname}
                </Link>
              </td>
              <td className={cn('figure text-ink-2 py-3 pr-4', stackedCell)}>
                <CellLabel>회원 번호</CellLabel>
                <span>{member.id}</span>
              </td>
              <td className={cn('py-3 pr-4', stackedCell)}>
                <CellLabel>이메일</CellLabel>
                {member.email ? (
                  <span className="text-ink-2 break-all">{member.email}</span>
                ) : (
                  <span className="text-ink-3">-</span>
                )}
              </td>
              <td className="py-3 pr-4 whitespace-nowrap max-lg:col-start-2 max-lg:row-start-1 max-lg:self-center max-lg:py-0 max-lg:pr-0">
                <span
                  className={cn(
                    'font-semibold',
                    member.status === 'SUSPENDED' ? 'text-destructive' : 'text-ink-2',
                  )}
                >
                  {MEMBER_STATUS_LABEL[member.status]}
                </span>
              </td>
              <td className={cn('py-3 pr-4 whitespace-nowrap', stackedCell)}>
                <CellLabel>판매자</CellLabel>
                {member.sellerStatus ? (
                  <span
                    className={
                      member.sellerStatus === 'SUSPENDED' ? 'text-destructive' : 'text-ink-2'
                    }
                  >
                    {SELLER_STATUS_LABEL[member.sellerStatus]}
                  </span>
                ) : (
                  <span className="text-ink-3">-</span>
                )}
              </td>
              <td className={cn('figure text-ink-2 py-3 whitespace-nowrap', stackedCell)}>
                <CellLabel>가입일</CellLabel>
                <span>{formatDateTime(member.createdAt)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
