import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import {
  toAddressForm,
  validateAddressForm,
  type AddressForm as AddressFormValue,
  type ShippingAddress,
} from '@/entities/address'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/StateMessage'
import { DEMO_ADDRESS } from '../config/demo-address'
import { embedPostcodeSearch, type PostcodeResult } from '../lib/postcode'
import { useRegisterAddress, useUpdateAddress } from '../model/use-manage-address'

type AddressFormProps = {
  /** 있으면 수정 모드 (전체 교체) */
  address?: ShippingAddress
  /** 등록 · 수정을 마치면 */
  onDone: () => void
}

/** 배송지 입력: 주소 찾기 → 상세 주소 → 받는 분 · 연락처 → 기본 배송지 */
export function AddressForm({ address, onDone }: AddressFormProps) {
  const create = useRegisterAddress({ onDone })
  const update = useUpdateAddress(address?.id ?? '', { onDone })
  const register = address ? update : create
  const [form, setForm] = useState<AddressFormValue>(() =>
    address ? toAddressForm(address) : DEMO_ADDRESS,
  )
  const [invalid, setInvalid] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const detailRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateAddressForm(form)
    setInvalid(message)
    if (!message) register.mutate(form)
  }

  const set = <K extends keyof AddressFormValue>(key: K, value: AddressFormValue[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSelectAddress = ({ zipCode, roadAddress }: PostcodeResult) => {
    setForm((prev) => ({ ...prev, zipCode, roadAddress, detailAddress: '' }))
    setIsSearching(false)
    // 고른 다음엔 상세 주소만 남는다
    requestAnimationFrame(() => detailRef.current?.focus())
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">주소</legend>
        <div className="flex gap-2">
          <Input
            aria-label="우편번호"
            placeholder="우편번호"
            className="figure h-11 w-32 text-base"
            value={form.zipCode}
            onChange={(e) => set('zipCode', e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 px-4"
            onClick={() => setIsSearching((prev) => !prev)}
          >
            {isSearching ? '검색 닫기' : '주소 찾기'}
          </Button>
        </div>
        {isSearching && <PostcodeSearch onSelect={handleSelectAddress} />}
        <Input
          aria-label="주소"
          placeholder="도로명 주소"
          className="h-11 text-base"
          value={form.roadAddress}
          onChange={(e) => set('roadAddress', e.target.value)}
        />
        <Input
          ref={detailRef}
          aria-label="상세 주소"
          placeholder="상세 주소 (동 · 호수, 선택)"
          className="h-11 text-base"
          value={form.detailAddress}
          onChange={(e) => set('detailAddress', e.target.value)}
        />
      </fieldset>

      <div className="space-y-4">
        <Label>
          받는 분
          <Input
            className="h-11 text-base"
            value={form.recipientName}
            onChange={(e) => set('recipientName', e.target.value)}
          />
        </Label>
        <Label>
          연락처
          <Input
            type="tel"
            inputMode="tel"
            placeholder="010-1234-5678"
            className="figure h-11 text-base"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </Label>
      </div>

      {/* 기본 배송지는 해제할 수 없다 (다른 배송지를 기본으로 바꾸면 풀린다) */}
      {!address?.isDefault && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-signal size-4"
            checked={form.isDefault}
            onChange={(e) => set('isDefault', e.target.checked)}
          />
          기본 배송지로 설정
        </label>
      )}

      <div className="space-y-2">
        {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
        {register.isError && (
          <StateMessage tone="error">{getErrorMessage(register.error)}</StateMessage>
        )}
        <Button
          type="submit"
          className="h-12 w-full text-[15px] font-semibold"
          disabled={register.isPending}
        >
          {address ? '저장하기' : '등록하기'}
        </Button>
      </div>
    </form>
  )
}

type PostcodeSearchProps = { onSelect: (result: PostcodeResult) => void }

/** 카카오 우편번호 검색을 폼 안에 펼친다. 불러오지 못하면 직접 입력하게 안내 */
function PostcodeSearch({ onSelect }: PostcodeSearchProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  // 렌더마다 바뀌는 onSelect 때문에 검색창을 다시 그리지 않게
  const handleSelect = useEffectEvent(onSelect)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    embedPostcodeSearch(box, (result) => handleSelect(result)).catch(() => setFailed(true))
    return () => box.replaceChildren()
  }, [])

  if (failed) {
    return (
      <StateMessage tone="error">
        주소 검색을 불러오지 못했어요. 우편번호와 주소를 직접 입력해 주세요.
      </StateMessage>
    )
  }
  return <div ref={boxRef} className="border-rule h-[420px] overflow-hidden rounded-lg border" />
}
