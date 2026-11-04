import { useState, type FormEvent } from 'react'
import { BODY_TYPE_LABEL, PREFERRED_FIT_LABEL } from '@/entities/child'
import { getErrorMessage, isMockActive } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useCompleteChildOnboarding } from '../model/use-complete-child-onboarding'

type ChildOnboardingProps = { step: 'NOTICE' | 'CONSENT'; hasProfile: boolean }
export function ChildOnboarding({ step, hasProfile }: ChildOnboardingProps) {
  const { notice, consent } = useCompleteChildOnboarding()
  const [required, setRequired] = useState(false)
  const [guardian, setGuardian] = useState(false)
  const [optional, setOptional] = useState(false)
  const [seller, setSeller] = useState(false)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [body, setBody] = useState('')
  const [fit, setFit] = useState('')
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    consent.mutate({
      optionalAgreed: optional,
      sellerProvisionAgreed: seller,
      heightCm: hasProfile ? null : Number(height),
      weightKg: hasProfile ? null : Number(weight),
      bodyType: body || null,
      preferredFit: fit || null,
    })
  }
  if (step === 'NOTICE')
    return (
      <section className="space-y-4">
        <h1 className="text-section">처음 만나요</h1>
        {isMockActive('GET', '/child/onboarding') && <p>목</p>}
        <p>
          보호자가 너의 이름과 키, 몸무게를 알려 줬어. 알맞은 옷을 추천하고 주문할 때 사용해.
          보호자는 네 계정과 장바구니, 조르기, 주문 내역을 볼 수 있어.
        </p>
        <Button disabled={notice.isPending} onClick={() => notice.mutate()}>
          확인
        </Button>
        {notice.isError && <p role="alert">{getErrorMessage(notice.error)}</p>}
      </section>
    )
  return (
    <form className="max-w-xl space-y-4" onSubmit={handleSubmit}>
      <h1 className="text-section">개인정보 동의</h1>
      {isMockActive('GET', '/child/onboarding') && <p>목</p>}
      <label className="block">
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />{' '}
        필수 동의: 이름, 생년월일, 성별, 키, 몸무게를 사이즈 맞춤 추천과 주문에 사용해요. 계정
        삭제까지 보관하며, 거부하면 서비스를 이용할 수 없어요.
      </label>
      <label className="block">
        <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} />{' '}
        선택 동의: 체형과 선호 핏을 맞춤 추천에 사용해요. 계정 삭제까지 보관하며 거부해도 이용할 수
        있어요.
      </label>
      <label className="block">
        <input type="checkbox" checked={seller} onChange={(e) => setSeller(e.target.checked)} />{' '}
        판매자 제공 동의: 주문한 상품의 판매자에게 사이즈 확인을 위해 이름, 키, 몸무게, 체형을
        제공해요. 주문 처리 기간 동안 보관하며 거부할 수 있어요.
      </label>
      <label className="block">
        <input type="checkbox" checked={guardian} onChange={(e) => setGuardian(e.target.checked)} />{' '}
        보호자 관리 고지 확인: 보호자는 비밀번호를 재설정하고 계정을 삭제할 수 있으며 장바구니,
        조르기, 주문 내역을 볼 수 있어요. 거부하면 서비스를 이용할 수 없어요.
      </label>
      {!hasProfile && (
        <div className="space-y-3">
          <label className="block">
            키(cm)
            <Input
              type="number"
              min="1"
              required
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </label>
          <label className="block">
            몸무게(kg)
            <Input
              type="number"
              min="1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
          <label className="block">
            체형{' '}
            <select disabled={!optional} value={body} onChange={(e) => setBody(e.target.value)}>
              <option value="">선택 안 함</option>
              {Object.entries(BODY_TYPE_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            선호 핏{' '}
            <select disabled={!optional} value={fit} onChange={(e) => setFit(e.target.value)}>
              <option value="">선택 안 함</option>
              {Object.entries(PREFERRED_FIT_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <Button type="submit" disabled={!required || !guardian || consent.isPending}>
        동의하고 계속
      </Button>
      {consent.isError && <p role="alert">{getErrorMessage(consent.error)}</p>}
    </form>
  )
}
