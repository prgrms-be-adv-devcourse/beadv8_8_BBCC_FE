import { useState } from 'react'
import { validateChargeAmount } from '@/entities/wallet'
import { getErrorMessage } from '@/shared/api'
import { env } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useRequestCharge } from '../model/use-charge-wallet'

type ChargeFormProps = { returnTo: { successPath: string; failPath: string } }

/** returnTo: 토스 결제창에서 돌아올 화면 (영역마다 다르다) */
export function ChargeForm({ returnTo }: ChargeFormProps) {
  const charge = useRequestCharge(returnTo)
  const [amount, setAmount] = useState(50_000)
  const invalid = validateChargeAmount(amount)

  return (
    <Card>
      <CardTitle className="mb-3">예치금 충전 (토스 테스트 결제)</CardTitle>
      <div className="flex items-end gap-3">
        <Label className="flex-1">
          충전 금액 (1천 원 ~ 100만 원)
          <Input
            type="number"
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </Label>
        <Button
          disabled={invalid !== null || !env.tossClientKey || charge.isPending}
          onClick={() => charge.mutate(amount)}
        >
          {formatWon(amount)} 충전하기
        </Button>
      </div>
      {!env.tossClientKey && (
        <StateMessage tone="error">VITE_TOSS_CLIENT_KEY가 없어 결제창을 열 수 없어요.</StateMessage>
      )}
      {charge.isError && <StateMessage tone="error">{getErrorMessage(charge.error)}</StateMessage>}
    </Card>
  )
}
