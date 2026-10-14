import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { addressKeys, type ShippingAddressRequest } from '@/entities/address'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/page-header'

// 기획서 7.1 시연 배송지 1
const INITIAL: ShippingAddressRequest = {
  recipientName: '홍길동',
  recipientPhone: '010-0000-0000',
  zipCode: '04524',
  roadAddress: '서울시 테스트로 1',
  detailAddress: null,
  isDefault: true,
}

const PHONE_PATTERN = /^010-\d{4}-\d{4}$/

export function AddressForm() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ShippingAddressRequest>(INITIAL)
  const [invalid, setInvalid] = useState<string | null>(null)

  const register = useMutation({
    mutationFn: (request: ShippingAddressRequest) =>
      runWithAction('배송지 등록', () => apiClient.post('/members/me/addresses', request)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message =
      !form.recipientName.trim() || !form.zipCode.trim() || !form.roadAddress.trim()
        ? '받는 분 · 우편번호 · 주소를 입력해 주세요.'
        : !PHONE_PATTERN.test(form.recipientPhone)
          ? '연락처는 010-1234-5678 형식이어야 해요.'
          : null
    setInvalid(message)
    if (!message) register.mutate(form)
  }

  const set = <K extends keyof ShippingAddressRequest>(key: K, value: ShippingAddressRequest[K]) =>
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
          <Input
            value={form.recipientPhone}
            onChange={(e) => set('recipientPhone', e.target.value)}
          />
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
            value={form.detailAddress ?? ''}
            onChange={(e) => set('detailAddress', e.target.value || null)}
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
