import { useState, type FormEvent } from 'react'
import {
  needsColorCode,
  validateAttributeValueForm,
  type AttributeInputType,
  type AttributeValueForm,
} from '@/entities/catalog'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useAddAttributeValue } from '../model/use-manage-catalog'
import { AttributeValueFields } from './AttributeValueFields'

const EMPTY_VALUE: AttributeValueForm = { name: '', colorCode: '' }

type AddAttributeValueFormProps = { attributeId: string; inputType: AttributeInputType }

/** 기존 항목에 목록 값 하나 더하기 */
export function AddAttributeValueForm({ attributeId, inputType }: AddAttributeValueFormProps) {
  const add = useAddAttributeValue(attributeId, inputType)
  const [value, setValue] = useState<AttributeValueForm>(EMPTY_VALUE)
  const [invalid, setInvalid] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateAttributeValueForm(value, inputType)
    setInvalid(message)
    if (!message) add.mutate(value, { onSuccess: () => setValue(EMPTY_VALUE) })
  }

  return (
    <form className="space-y-1" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <AttributeValueFields
          value={value}
          hasColor={needsColorCode(inputType)}
          onChange={setValue}
        />
        <Button type="submit" size="sm" variant="outline" disabled={add.isPending}>
          값 더하기
        </Button>
      </div>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {add.isError && <StateMessage tone="error">{getErrorMessage(add.error)}</StateMessage>}
    </form>
  )
}
