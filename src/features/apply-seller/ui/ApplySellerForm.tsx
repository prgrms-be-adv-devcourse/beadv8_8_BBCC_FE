import { useState, type FormEvent } from 'react'
import { validateSellerApplicationForm, type SellerApplicationForm } from '@/entities/seller'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { DEMO_APPLICATION } from '../config/demo-application'
import { useApplySeller } from '../model/use-apply-seller'

export function ApplySellerForm() {
  const apply = useApplySeller()
  const [form, setForm] = useState<SellerApplicationForm>(DEMO_APPLICATION)
  const [invalid, setInvalid] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateSellerApplicationForm(form)
    setInvalid(message)
    if (!message) apply.mutate(form)
  }

  return (
    <Card>
      <CardTitle className="mb-3">판매자 신청</CardTitle>
      <form className="grid grid-cols-3 gap-3" onSubmit={handleSubmit}>
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
