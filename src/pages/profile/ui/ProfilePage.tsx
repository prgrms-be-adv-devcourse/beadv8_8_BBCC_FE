import { useNavigate } from 'react-router'
import { describeUser, ROLE_LABEL, useSessionStore } from '@/entities/session'
import { EditNicknameForm, WithdrawButton } from '@/features/edit-profile'
import { paths } from '@/shared/config'
import { Card, CardTitle } from '@/shared/ui/card'
import { PageHeader, StateMessage } from '@/shared/ui/page-header'

/** 내 정보: 닉네임 수정 · 탈퇴 */
export function ProfilePage() {
  const navigate = useNavigate()
  const user = useSessionStore((state) => state.user)
  const member = useSessionStore((state) => state.member)

  if (!user) return <StateMessage>로그인하면 볼 수 있어요.</StateMessage>

  return (
    <div className="space-y-4">
      <PageHeader
        title="내 정보"
        step="①"
        description="닉네임을 바꾸면 토큰을 다시 받아 바로 반영돼요."
        note="PATCH /members/me → 토큰 재발급(시연 계정은 개발용 토큰 다시 발급). 탈퇴는 백엔드에 없어 목이에요."
      />
      <Card className="space-y-1 text-sm">
        <CardTitle className="mb-1">계정</CardTitle>
        <p>{describeUser(user)}</p>
        <p className="text-muted-foreground">
          역할 {user.roles.map((role) => ROLE_LABEL[role]).join(' · ')}
          {member && ` · 로그인 ${member.providers.join(' · ') || '개발용 토큰'}`}
        </p>
      </Card>
      <Card>
        <CardTitle className="mb-3">닉네임</CardTitle>
        <EditNicknameForm key={user.nickname} current={user.nickname} />
      </Card>
      <Card className="flex items-center justify-between">
        <div>
          <p className="font-semibold">탈퇴</p>
          <p className="text-muted-foreground text-sm">
            탈퇴 조건은 아직 정해지지 않았어요 (기획서 2.1).
          </p>
        </div>
        <WithdrawButton onDone={() => navigate(paths.shop.home, { replace: true })} />
      </Card>
    </div>
  )
}
