import { Link, useNavigate } from 'react-router'
import { useGuardianVerificationQuery } from '@/entities/guardian-verification'
import { RegisterChildForm } from '@/features/register-child'
import { VerifyGuardian } from '@/features/verify-guardian'
import { getErrorMessage } from '@/shared/api'
import { memberPathsOf } from '@/shared/config'
import { useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 등록하면 Kidly가 하는 일 */
const REGISTER_STEPS = [
  {
    title: '키와 몸무게 입력',
    body: '생년월일, 성별과 함께요. 체형과 핏은 골라도 되고 안 골라도 돼요.',
  },
  { title: '맞는 사이즈 계산', body: '아동복 일반 표기(호칭 = 키)로 지금 사이즈 구간을 잡아요.' },
  { title: '상품마다 표시', body: '맞는 사이즈가 있는 옷에 「잘 맞아요」 꼬리표가 붙어요.' },
]

/** 자녀 등록 (목록과 따로): 왼쪽 등록하면 하는 일 세 단계, 오른쪽 폼. 보호자 본인인증 전이면 폼 대신 본인인증. 등록하면 목록으로 */
export function ShopChildNewPage() {
  const navigate = useNavigate()
  const memberPaths = memberPathsOf(useArea())
  const verification = useGuardianVerificationQuery()

  return (
    <div className="shop-look space-y-6">
      <Link
        to={memberPaths.children}
        className="text-ink-3 hover:text-ink inline-flex items-center gap-1 rounded-md text-[13px] font-semibold transition-colors"
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
        자녀 프로필
      </Link>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="space-y-8 lg:sticky lg:top-32 lg:self-start">
          <PageHeader
            title="자녀 등록"
            step="①"
            description="키와 몸무게만 알려 주시면, 상품마다 맞는 사이즈를 골라 드려요."
            note="자녀를 등록하면 회원이 child.changed 이벤트를 보내고, 추천 · 주문이 각자 복사본을 저장해요."
          />
          <ol className="border-rule space-y-5 border-t pt-6">
            {REGISTER_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3.5">
                <span
                  aria-hidden
                  className="border-signal text-signal figure flex size-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold"
                >
                  {index + 1}
                </span>
                <div className="space-y-0.5 pt-0.5">
                  <p className="text-sm font-bold">{step.title}</p>
                  <p className="text-ink-3 text-[13px]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="border-rule rounded-xl border p-5 md:p-8">
          {verification.isPending && <StateMessage>불러오는 중…</StateMessage>}
          {verification.isError && (
            <StateMessage tone="error">{getErrorMessage(verification.error)}</StateMessage>
          )}
          {verification.data &&
            (verification.data.verified ? (
              <RegisterChildForm
                onRegistered={() => navigate(memberPaths.children, { replace: true })}
              />
            ) : (
              <VerifyGuardian />
            ))}
        </div>
      </div>
    </div>
  )
}
