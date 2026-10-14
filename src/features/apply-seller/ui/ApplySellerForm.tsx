import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { sellerKeys } from '@/entities/seller'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/page-header'

type Form = { businessName: string; representativeName: string; businessRegistrationNumber: string }

export function ApplySellerForm() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Form>({
    businessName: '테스트상점',
    representativeName: '홍길동',
    businessRegistrationNumber: '1234567890',
  })
  const [invalid, setInvalid] = useState<string | null>(null)

  const apply = useMutation({
    mutationFn: () =>
      runWithAction('판매자 신청', () => apiClient.post('/members/me/seller-application', form)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sellerKeys.myApplication }),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message =
      !form.businessName.trim() || !form.representativeName.trim()
        ? '상호명과 대표자명을 입력해 주세요.'
        : !/^\d{10}$/.test(form.businessRegistrationNumber)
          ? '사업자등록번호는 하이픈 없는 숫자 10자리예요.'
          : null
    setInvalid(message)
    if (!message) apply.mutate()
  }

  return (
    <Card>
      <CardTitle className="mb-3">판매자 신청</CardTitle>
      <form className="grid grid-cols-3 gap-3" onSubmit={submit}>
        <Label>
          상호명
          <Input
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
          />
        </Label>
        <Label>
          대표자명
          <Input
            value={form.representativeName}
            onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
          />
        </Label>
        <Label>
          사업자등록번호
          <Input
            value={form.businessRegistrationNumber}
            onChange={(e) => setForm({ ...form, businessRegistrationNumber: e.target.value })}
          />
        </Label>
        <div className="col-span-3 flex items-center gap-3">
          <Button type="submit" disabled={apply.isPending}>
            신청하기
          </Button>
          {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
          {apply.isError && (
            <StateMessage tone="error">{getErrorMessage(apply.error)}</StateMessage>
          )}
        </div>
      </form>
    </Card>
  )
}
