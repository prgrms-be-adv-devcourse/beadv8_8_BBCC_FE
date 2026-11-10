import { canBeOption, moveLink, type Attribute, type ProductTypeLinkForm } from '@/entities/catalog'
import { Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { ProductTypeLinkFields } from './ProductTypeLinkFields'

/** 고를 수 있으면 옵션 · 필수 · 모든 값 허용으로 연결하고, 아니면 선택 정보 항목으로 */
function newLink(attribute: Attribute): ProductTypeLinkForm {
  return {
    attributeId: attribute.id,
    role: canBeOption(attribute.inputType) ? 'OPTION' : 'INFO',
    required: canBeOption(attribute.inputType),
    allValuesAllowed: true,
    sizeRole: false,
    priceAffecting: false,
    allowedValueIds: [],
  }
}

type ProductTypeLinksEditorProps = {
  attributes: Attribute[]
  links: ProductTypeLinkForm[]
  onChange: (links: ProductTypeLinkForm[]) => void
}

/** 유형에 연결할 항목: 고르기 · 설정 · 순서 바꾸기 · 빼기 (만들기 · 수정 폼이 같이 쓴다) */
export function ProductTypeLinksEditor({
  attributes,
  links,
  onChange,
}: ProductTypeLinksEditorProps) {
  const linked = new Set(links.map((link) => link.attributeId))

  const addLink = (attributeId: string) => {
    const attribute = attributes.find((item) => item.id === attributeId)
    if (attribute) onChange([...links, newLink(attribute)])
  }

  return (
    <>
      <Label>
        연결할 항목
        <Select className="h-10" value="" onChange={(e) => addLink(e.target.value)}>
          <option value="">항목 고르기</option>
          {attributes
            .filter((attribute) => !linked.has(attribute.id))
            .map((attribute) => (
              <option key={attribute.id} value={attribute.id}>
                {attribute.name} ({attribute.code})
              </option>
            ))}
        </Select>
      </Label>
      {links.map((link, index) => {
        const attribute = attributes.find((item) => item.id === link.attributeId)
        return (
          attribute && (
            <ProductTypeLinkFields
              key={link.attributeId}
              attribute={attribute}
              link={link}
              onChange={(next) => onChange(links.map((item, i) => (i === index ? next : item)))}
              onRemove={() => onChange(links.filter((_, i) => i !== index))}
              onMoveUp={index > 0 ? () => onChange(moveLink(links, index, -1)) : undefined}
              onMoveDown={
                index < links.length - 1 ? () => onChange(moveLink(links, index, 1)) : undefined
              }
            />
          )
        )
      })}
    </>
  )
}
