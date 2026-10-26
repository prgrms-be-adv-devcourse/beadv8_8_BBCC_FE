import { useState, type FormEvent } from 'react'
import { validateSellerApplicationForm, type SellerApplicationForm } from '@/entities/seller'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { DEMO_APPLICATION } from '../config/demo-application'
import { useApplySeller } from '../model/use-apply-seller'

/** 판매자 신청서: 상호명 · 대표자명 · 사업자등록번호 세 칸. 겉 테두리 · 제목은 화면이 둔다 */
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
    <form className="max-w-md space-y-4" onSubmit={handleSubmit}>
      <Label className="text-ink-2 gap-1.5 text-[13px] font-semibold">
        상호명
        <Input
          className="h-10 text-[15px]"
          value={form.businessName}
          onChange={(e) => setForm({ ...form, businessName: e.target.value })}
        />
      </Label>
      <Label className="text-ink-2 gap-1.5 text-[13px] font-semibold">
        대표자명
        <Input
          className="h-10 text-[15px]"
          value={form.representativeName}
          onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
        />
      </Label>
      <Label className="text-ink-2 gap-1.5 text-[13px] font-semibold">
        사업자등록번호
        <Input
          className="figure h-10 text-[15px]"
          value={form.businessRegistrationNumber}
          onChange={(e) => setForm({ ...form, businessRegistrationNumber: e.target.value })}
        />
      </Label>
      <div className="space-y-2 pt-1">
        <Button type="submit" className="h-11 px-6 text-[15px]" disabled={apply.isPending}>
          신청하기
        </Button>
        {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
        {apply.isError && <StateMessage tone="error">{getErrorMessage(apply.error)}</StateMessage>}
      </div>
    </form>
  )
}
