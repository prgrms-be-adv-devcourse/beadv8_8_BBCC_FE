import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ROLE_LABEL, useSessionStore } from '@/entities/session'
import { EditNicknameForm, WithdrawButton } from '@/features/edit-profile'
import { paths } from '@/shared/config'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/**
 * 내 정보: 프로필 → 회원 정보(닉네임 변경) → 로그인 정보 → 탈퇴.
 * 쇼핑몰 회원정보 화면처럼 「라벨 · 값 · 변경」 한 줄씩, 변경은 그 줄 아래에서 펼친다
 */
export function ShopProfilePage() {
  const navigate = useNavigate()
  const user = useSessionStore((state) => state.user)
  const member = useSessionStore((state) => state.member)
  // 닉네임이 바뀌면(토큰 재발급) 펼친 폼이 저절로 닫히게 바꾸던 닉네임을 기억한다
  const [editingFor, setEditingFor] = useState<string | null>(null)

  if (!user) return <StateMessage>로그인하면 볼 수 있어요.</StateMessage>

  const editing = editingFor === user.nickname

  return (
    <div className="shop-look max-w-2xl space-y-10">
      <PageHeader
        title="내 정보"
        step="①"
        description="닉네임을 바꾸면 토큰을 다시 받아 바로 반영돼요."
        note="PATCH /members/me → 토큰 재발급(시연 계정은 개발용 토큰 다시 발급). 탈퇴는 백엔드에 없어 목이에요."
      />

      <section aria-label="프로필" className="flex items-center gap-4">
        <span
          aria-hidden
          className="bg-signal-soft text-signal flex size-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold"
        >
          {user.nickname.slice(0, 1)}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-ink truncate text-xl font-bold">{user.nickname}님</p>
          <p className="text-ink-3 truncate text-sm">{member?.email ?? '등록된 이메일이 없어요'}</p>
        </div>
      </section>

      <InfoSection title="회원 정보">
        <div>
          <InfoRow
            label="닉네임"
            action={
              <button
                type="button"
                aria-expanded={editing}
                onClick={() => setEditingFor(editing ? null : user.nickname)}
                className="border-rule text-ink-2 hover:border-field-edge inline-flex h-8 items-center rounded-full border px-3 text-[13px] font-semibold transition-colors"
              >
                {editing ? '취소' : '변경'}
              </button>
            }
          >
            {user.nickname}
          </InfoRow>
          {editing && (
            <div className="bg-paper-2 px-5 pt-1 pb-5">
              <EditNicknameForm current={user.nickname} />
            </div>
          )}
        </div>
        {member && <InfoRow label="이메일">{member.email ?? '없음'}</InfoRow>}
        <InfoRow label="회원 번호">
          <span className="figure">{user.memberId}</span>
        </InfoRow>
        <InfoRow label="회원 유형">
          <span className="flex flex-wrap gap-1.5">
            {user.roles.map((role) => (
              <span
                key={role}
                className="bg-paper-2 text-ink-2 inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold"
              >
                {ROLE_LABEL[role]}
              </span>
            ))}
          </span>
        </InfoRow>
      </InfoSection>

      <InfoSection title="로그인 정보">
        {member ? (
          <InfoRow
            label="카카오"
            action={
              member.providers.includes('KAKAO') ? (
                <span className="text-signal text-[13px] font-semibold">연결됨</span>
              ) : (
                <span className="text-ink-3 text-[13px]">연결 안 됨</span>
              )
            }
          >
            <span className="text-ink-3">카카오 계정으로 로그인</span>
          </InfoRow>
        ) : (
          <InfoRow label="로그인 방식">개발용 토큰</InfoRow>
        )}
      </InfoSection>

      {/* 탈퇴: 맨 아래 조용하게 */}
      <section
        aria-label="탈퇴"
        className="border-rule flex flex-wrap items-center justify-between gap-3 border-t pt-6"
      >
        <p className="text-ink-3 text-[13px]">탈퇴 조건은 아직 정해지지 않았어요 (기획서 2.1).</p>
        <WithdrawButton onDone={() => navigate(paths.shop.home, { replace: true })} />
      </section>
    </div>
  )
}

type InfoSectionProps = { title: string; children: ReactNode }

function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section aria-label={title} className="space-y-3">
      <h2 className="text-section">{title}</h2>
      <dl className="border-rule divide-rule divide-y overflow-hidden rounded-xl border">
        {children}
      </dl>
    </section>
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
