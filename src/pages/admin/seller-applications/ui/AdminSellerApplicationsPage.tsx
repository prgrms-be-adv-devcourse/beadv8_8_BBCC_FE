import { useState, type ReactNode } from 'react'
import {
  APPLICATION_STATUS_LABEL,
  canApprove,
  useSellerApplicationsQuery,
  type SellerApplicationSummary,
} from '@/entities/seller'
import { ApproveSellerButton } from '@/features/approve-seller'
import { RejectSellerForm } from '@/features/reject-seller'
import { getErrorMessage } from '@/shared/api'
import { cn, formatDateTime } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

/**
 * 판매자 신청 심사: 위는 심사 대기 표(줄마다 승인 · 거절), 아래는 처리한 신청 표.
 * 거절 사유는 그 줄 아래에서 펼친다
 */
export function AdminSellerApplicationsPage() {
  const applications = useSellerApplicationsQuery(null)
  const all = applications.data?.content ?? []
  const pending = all.filter(canApprove)
  const processed = all.filter((application) => !canApprove(application))

  return (
    <div className="shop-look space-y-8">
      <PageHeader
        title="판매자 신청 심사"
        step="②"
        description="신청을 확인하고 승인하거나 거절해요. 거절 사유는 신청자에게 보여요."
        note="승인하면 신청한 회원이 다음 토큰부터 SELLER 역할을 받아요."
      />
      {applications.isPending && <ListSkeleton />}
      {applications.isError && (
        <StateMessage tone="error">{getErrorMessage(applications.error)}</StateMessage>
      )}

      {applications.data && (
        <>
          <section aria-label="심사 대기" className="space-y-3">
            <SectionTitle count={pending.length}>심사 대기</SectionTitle>
            {pending.length === 0 ? (
              <p className="bg-paper-2 text-ink-2 rounded-lg py-10 text-center text-sm">
                심사할 신청이 없어요.
              </p>
            ) : (
              <ApplicationTable label="심사 대기" lastColumn="심사">
                {pending.map((application) => (
                  <PendingRow key={application.id} application={application} />
                ))}
              </ApplicationTable>
            )}
          </section>

          {processed.length > 0 && (
            <section aria-label="처리한 신청" className="space-y-3">
              <SectionTitle count={processed.length}>처리한 신청</SectionTitle>
              <ApplicationTable label="처리한 신청" lastColumn="상태">
                {processed.map((application) => (
                  <tr key={application.id} className={ROW}>
                    <ApplicationCells application={application} />
                    <td className={cn(CELL, 'text-ink-2 font-semibold whitespace-nowrap')}>
                      {APPLICATION_STATUS_LABEL[application.status]}
                    </td>
                  </tr>
                ))}
              </ApplicationTable>
            </section>
          )}
        </>
      )}
    </div>
  )
}

const ROW = 'border-rule border-b max-lg:flex max-lg:flex-col max-lg:gap-1 max-lg:py-4'
const CELL = 'py-3 pr-4 align-middle max-lg:p-0'
const COLUMN_COUNT = 5

type SectionTitleProps = { count: number; children: ReactNode }

function SectionTitle({ count, children }: SectionTitleProps) {
  return (
    <h2 className="text-section">
      {children}
      <span className="figure text-ink-3 ml-2 text-sm font-medium">{count}건</span>
    </h2>
  )
}

type ApplicationTableProps = {
  label: string
  /** 마지막 칸 머리 (심사 대기는 승인 · 거절, 처리한 신청은 상태) */
  lastColumn: string
  children: ReactNode
}

/** 상호 · 신청자 · 사업자번호 · 신청 일시 · 마지막 칸. 휴대폰은 줄마다 쌓는다 */
function ApplicationTable({ label, lastColumn, children }: ApplicationTableProps) {
  return (
    <table aria-label={label} className="w-full text-sm max-lg:block">
      <thead className="max-lg:sr-only">
        <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
          <th scope="col" className="py-2 pr-4 font-medium">
            상호
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            신청자
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            사업자번호
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            신청 일시
          </th>
          <th scope="col" className="py-2 font-medium">
            {lastColumn}
          </th>
        </tr>
      </thead>
      <tbody className="max-lg:block">{children}</tbody>
    </table>
  )
}

type ApplicationCellsProps = { application: SellerApplicationSummary }

/** 두 표가 같이 쓰는 앞의 네 칸 */
function ApplicationCells({ application }: ApplicationCellsProps) {
  return (
    <>
      <td className={cn(CELL, 'text-ink font-semibold break-all')}>{application.businessName}</td>
      <td className={CELL}>
        <CellLabel>신청자</CellLabel>
        {application.applicantNickname}
        <span className="figure text-ink-3 ml-1 text-[13px]">회원 {application.applicantId}</span>
      </td>
      <td className={cn(CELL, 'figure whitespace-nowrap')}>
        <CellLabel>사업자번호</CellLabel>
        {application.maskedBusinessRegistrationNumber}
      </td>
      <td className={cn(CELL, 'figure text-ink-2 whitespace-nowrap')}>
        <CellLabel>신청 일시</CellLabel>
        {formatDateTime(application.createdAt)}
      </td>
    </>
  )
}

type PendingRowProps = { application: SellerApplicationSummary }

/** 심사 대기 한 줄: 승인은 한 번에, 거절은 사유 칸을 줄 아래에 펼친다 */
function PendingRow({ application }: PendingRowProps) {
  const [isRejecting, setIsRejecting] = useState(false)
  return (
    <>
      <tr className={cn(ROW, isRejecting && 'border-b-0')}>
        <ApplicationCells application={application} />
        <td className={cn(CELL, 'pr-0 max-lg:pt-2')}>
          <span className="flex flex-wrap items-center gap-2">
            <ApproveSellerButton applicationId={application.id} />
            {!isRejecting && (
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="border-rule text-ink-2 hover:border-field-edge inline-flex h-8 items-center rounded-md border px-3 text-[13px] font-semibold transition-colors max-lg:h-11"
              >
                거절
              </button>
            )}
          </span>
        </td>
      </tr>
      {isRejecting && (
        <tr className="border-rule border-b max-lg:block">
          <td colSpan={COLUMN_COUNT} className="pb-4 max-lg:block">
            <div className="bg-paper-2 rounded-md p-4">
              <RejectSellerForm
                applicationId={application.id}
                onCancel={() => setIsRejecting(false)}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

type CellLabelProps = { children: ReactNode }

/** 휴대폰에서만 보이는 칸 이름 (넓은 화면은 표 머리) */
function CellLabel({ children }: CellLabelProps) {
  return <span className="text-ink-3 mr-1.5 text-[13px] lg:hidden">{children}</span>
}
