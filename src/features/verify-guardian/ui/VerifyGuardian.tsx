import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { VerificationWindowError } from '../lib/portone'
import { useVerifyGuardian } from '../model/use-verify-guardian'

/** 첫 자녀 등록 전 보호자 휴대폰 본인인증. 인증하면 인증 상태를 다시 불러와 부르는 화면이 등록 폼으로 바꾼다 */
export function VerifyGuardian() {
  const verification = useVerifyGuardian()
  const error = verification.error

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold">처음 한 번 보호자 본인인증이 필요해요.</p>
      <p className="text-ink-3 text-[13px]">
        자녀 개인정보 동의를 성인 보호자가 했는지 확인해요. 휴대폰 본인인증으로 이름 · 휴대폰 번호 ·
        생년월일을 확인하고, 생년월일 · 인증 일시 · 인증 거래번호만 보관해요. 이름과 휴대폰 번호는
        같은 사람이 여러 번 인증하지 않았는지 확인하는 데만 쓰고 보관하지 않아요.
      </p>
      <Button
        className="h-11 px-6 text-[15px]"
        disabled={verification.isPending}
        onClick={() => verification.mutate()}
      >
        휴대폰 본인인증
      </Button>
      {error && (
        <StateMessage tone="error">
          {error instanceof VerificationWindowError ? error.message : getErrorMessage(error)}
        </StateMessage>
      )}
    </div>
  )
}
