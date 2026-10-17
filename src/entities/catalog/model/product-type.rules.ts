import type { Attribute, AttributeInputType, ProductTypeForm, ProductTypeLinkForm } from './catalog'

// BE 도메인(상품 유형 정의)과 같은 순서 · 뜻으로 미리 막는다. 보내도 BE가 같은 이유로 400을 준다

/** 옵션 항목은 값을 하나 고르는 팔레트 · 목록만 (여러 개 고름 · 직접 입력은 정보 항목으로) */
export function canBeOption(inputType: AttributeInputType): boolean {
  return inputType === 'PALETTE' || inputType === 'LIST'
}

const isOption = (link: ProductTypeLinkForm) => link.role === 'OPTION'

function hasDuplicatedAttribute(links: ProductTypeLinkForm[]): boolean {
  return new Set(links.map((link) => link.attributeId)).size !== links.length
}

function hasLinkWithoutAllowedValues(
  links: ProductTypeLinkForm[],
  inputTypeOf: (attributeId: string) => AttributeInputType | undefined,
): boolean {
  return links.some(
    (link) =>
      inputTypeOf(link.attributeId) !== 'TEXT' &&
      !link.allValuesAllowed &&
      link.allowedValueIds.length === 0,
  )
}

export function validateProductTypeForm(
  form: ProductTypeForm,
  attributes: Attribute[],
): string | null {
  const inputTypeOf = (attributeId: string) =>
    attributes.find((attribute) => attribute.id === attributeId)?.inputType
  const { links } = form
  if (!form.name.trim()) return '유형 이름을 입력해 주세요.'
  if (hasDuplicatedAttribute(links)) return '같은 항목을 두 번 연결할 수 없어요.'
  if (!links.some((link) => isOption(link) && link.required))
    return '필수 옵션 항목을 하나 이상 연결해 주세요.'
  if (links.filter((link) => link.sizeRole).length > 1)
    return '사이즈 역할은 항목 하나에만 둘 수 있어요.'
  if (links.some((link) => link.sizeRole && !isOption(link)))
    return '사이즈 역할은 옵션 항목에만 둘 수 있어요.'
  if (links.some((link) => link.priceAffecting && !isOption(link)))
    return '가격 구분은 옵션 항목에만 둘 수 있어요.'
  if (links.some((link) => isOption(link) && !canBeOption(inputTypeOf(link.attributeId) ?? 'TEXT')))
    return '옵션 항목에는 값을 하나 고르는 팔레트나 목록 항목만 연결해 주세요.'
  if (hasLinkWithoutAllowedValues(links, inputTypeOf))
    return '모든 값을 허용하지 않는 항목에는 허용 값을 하나 이상 골라 주세요.'
  return null
}
