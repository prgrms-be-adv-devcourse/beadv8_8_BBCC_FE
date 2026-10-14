import { useState, type FormEvent } from 'react'
import { validateAddressForm, type AddressForm as AddressFormValue } from '@/entities/address'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/page-header'
import { DEMO_ADDRESS } from '../config/demo-address'
import { useRegisterAddress } from '../model/use-manage-address'

export function AddressForm() {
  const register = useRegisterAddress()
  const [form, setForm] = useState<AddressFormValue>(DEMO_ADDRESS)
  const [invalid, setInvalid] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateAddressForm(form)
    setInvalid(message)
    if (!message) register.mutate(form)
  }

  const set = <K extends keyof AddressFormValue>(key: K, value: AddressFormValue[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Card>
      <CardTitle className="mb-3">배송지 등록</CardTitle>
      <form className="grid grid-cols-2 gap-3" onSubmit={submit}>
        <Label>
          받는 분
          <Input
            value={form.recipientName}
            onChange={(e) => set('recipientName', e.target.value)}
          />
        </Label>
        <Label>
          연락처
          <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Label>
        <Label>
          우편번호
          <Input value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} />
        </Label>
        <Label>
          주소
          <Input value={form.roadAddress} onChange={(e) => set('roadAddress', e.target.value)} />
        </Label>
        <Label>
          상세 주소 (선택)
          <Input
            value={form.detailAddress}
            onChange={(e) => set('detailAddress', e.target.value)}
          />
        </Label>
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => set('isDefault', e.target.checked)}
          />
          기본 배송지로
        </label>
        <div className="col-span-2 flex items-center gap-3">
          <Button type="submit" disabled={register.isPending}>
            등록하기
          </Button>
          {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
          {register.isError && (
            <StateMessage tone="error">{getErrorMessage(register.error)}</StateMessage>
          )}
        </div>
      </form>
    </Card>
  )
}
