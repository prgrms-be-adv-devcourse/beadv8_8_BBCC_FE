import { useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import {
  canGrantAdmin,
  canRevokeAdmin,
  canSuspendMember,
  canSuspendSeller,
  MEMBER_STATUS_LABEL,
  useAdminMemberQuery,
} from '@/entities/member'
import { SELLER_STATUS_LABEL } from '@/entities/seller'
import { useSessionStore } from '@/entities/session'
import { GrantAdminButton, RevokeAdminButton } from '@/features/manage-admin-role'
import { SuspendMemberForm, SuspendSellerForm } from '@/features/suspend-member'
import { getErrorMessage } from '@/shared/api'
import { adminPathsOf } from '@/shared/config'
import { cn, formatDateTime, useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ListSkeleton } from '@/shared/ui/Skeleton'
import { StateMessage } from '@/shared/ui/StateMessage'

type OpenForm = 'member' | 'seller' | null

/** 줄 끝 동작 버튼 (판매자 센터 상점 정보의 「상호명 수정」과 같은 모양) */
const ROW_ACTION_CLASS =
  'border-rule text-ink-2 hover:border-field-edge inline-flex h-9 shrink-0 items-center rounded-md border px-3 text-[13px] font-semibold transition-colors max-lg:h-11'

/**
 * 회원 상세: 회원 정보 → 상태 · 권한 (「라벨 · 값 · 동작」 한 줄씩).
 * 정지 사유 입력은 그 줄 아래에서 펼친다
 */
export function AdminMemberDetailPage() {
  const { memberId = '' } = useParams()
  const adminPaths = adminPathsOf(useArea())
  // 목록에서 넘겨준 구분 · 검색어(?filter= · ?q=)로 돌아간다
  const listSearch = (useLocation().state as { listSearch?: string } | null)?.listSearch ?? ''
  const { member, isPending, error } = useAdminMemberQuery(memberId)
  const myMemberId = useSessionStore((s) => s.user?.memberId)
  const [openForm, setOpenForm] = useState<OpenForm>(null)
  const close = () => setOpenForm(null)

  return (
    <div className="shop-look max-w-3xl space-y-6">
      <Link
        to={{ pathname: adminPaths.members, search: listSearch }}
        className="text-ink-3 hover:text-ink inline-flex min-h-8 items-center gap-1 rounded-md text-[13px] font-semibold transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        회원 관리
      </Link>
      <PageHeader
        title={`회원 #${memberId}`}
        description="이용을 정지하거나 판매자 자격을 정지하고, 관리자를 지정 · 해제해요. 권한을 바꾼 회원은 새로고침해야 메뉴가 바뀌어요."
        note="회원 하나 API가 없어 목록 API(filter=ALL · ADMIN, keyword=회원 번호)에서 찾아요. 이용 정지 → 로그인 · 재발급 막힘. 판매자 자격 정지 → seller.changed. 관리자 지정 · 해제 → 다음 토큰 재발급부터 ADMIN 역할 반영 (BE #356)"
      />
      {isPending && <ListSkeleton rows={2} />}
      {error && <StateMessage tone="error">{getErrorMessage(error)}</StateMessage>}
      {!isPending && !error && !member && (
        <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">
          없거나 탈퇴한 회원이에요.
        </p>
      )}
      {member && (
        <>
          <section aria-label="회원 정보" className="space-y-3">
            <h2 className="text-section">회원 정보</h2>
            <dl className="border-rule divide-rule divide-y overflow-hidden rounded-lg border">
              <InfoRow label="닉네임">{member.nickname}</InfoRow>
              <InfoRow label="회원 번호">
                <span className="figure">{member.id}</span>
              </InfoRow>
              <InfoRow label="이메일">
                {member.email ?? <span className="text-ink-3 font-normal">없음</span>}
              </InfoRow>
              <InfoRow label="가입일">
                <span className="figure">{formatDateTime(member.createdAt)}</span>
              </InfoRow>
            </dl>
          </section>

          <section aria-label="상태 · 권한" className="space-y-3">
            <h2 className="text-section">상태 · 권한</h2>
            <dl className="border-rule divide-rule divide-y overflow-hidden rounded-lg border">
              <div>
                <InfoRow
                  label="이용 상태"
                  action={
                    canSuspendMember(member) &&
                    openForm !== 'member' && (
                      <button
                        type="button"
                        className={ROW_ACTION_CLASS}
                        onClick={() => setOpenForm('member')}
                      >
                        이용 정지
                      </button>
                    )
                  }
                >
                  <span className={cn(member.status === 'SUSPENDED' && 'text-destructive')}>
                    {MEMBER_STATUS_LABEL[member.status]}
                  </span>
                </InfoRow>
                {openForm === 'member' && canSuspendMember(member) && (
                  <div className="bg-paper-2 px-5 pt-1 pb-5">
                    <SuspendMemberForm memberId={member.id} onClose={close} />
                  </div>
                )}
              </div>
              {member.suspendReason && (
                <InfoRow label="정지 사유">
                  <span className="font-normal">{member.suspendReason}</span>
                </InfoRow>
              )}
              {member.suspendedAt && (
                <InfoRow label="정지 시각">
                  <span className="figure font-normal">{formatDateTime(member.suspendedAt)}</span>
                </InfoRow>
              )}
              <div>
                <InfoRow
                  label="판매자"
                  action={
                    canSuspendSeller(member) &&
                    openForm !== 'seller' && (
                      <button
                        type="button"
                        className={ROW_ACTION_CLASS}
                        onClick={() => setOpenForm('seller')}
                      >
                        판매자 자격 정지
                      </button>
                    )
                  }
                >
                  {member.sellerStatus ? (
                    <span className={cn(member.sellerStatus === 'SUSPENDED' && 'text-destructive')}>
                      {SELLER_STATUS_LABEL[member.sellerStatus]}
                    </span>
                  ) : (
                    <span className="text-ink-3 font-normal">판매자 아님</span>
                  )}
                </InfoRow>
                {openForm === 'seller' && canSuspendSeller(member) && (
                  <div className="bg-paper-2 px-5 pt-1 pb-5">
                    <SuspendSellerForm sellerId={member.id} onClose={close} />
                  </div>
                )}
              </div>
              <InfoRow
                label="권한"
                action={
                  <>
                    {canGrantAdmin(member) && <GrantAdminButton memberId={member.id} />}
                    {canRevokeAdmin(member, myMemberId) && (
                      <RevokeAdminButton memberId={member.id} />
                    )}
                  </>
                }
              >
                {member.isAdmin ? '관리자' : '일반 회원'}
              </InfoRow>
            </dl>
          </section>
        </>
      )}
    </div>
  )
}

type InfoRowProps = { label: string; action?: ReactNode; children: ReactNode }

function InfoRow({ label, action, children }: InfoRowProps) {
  return (
    <div className="flex min-h-14 items-center gap-4 px-5 py-3">
      <dt className="text-ink-3 w-20 shrink-0 text-sm">{label}</dt>
      <dd className="text-ink min-w-0 flex-1 text-sm font-semibold break-all">{children}</dd>
      {action}
    </div>
  )
}
