import type {
  ProductTypeChangeRequestDto,
  ProductTypeCreateRequestDto,
  ProductTypeDto,
  ProductTypeLinkRequestDto,
} from '../api/catalog.dto'
import type {
  AttributeInputType,
  AttributeRole,
  ProductType,
  ProductTypeForm,
  ProductTypeLinkForm,
} from './catalog'

export function toProductType(dto: ProductTypeDto): ProductType {
  return {
    id: dto.productTypeId,
    name: dto.name,
    // 정해지지 않은 입력 방식 · 역할은 계약 검사(흐름 패널)가 드러낸다
    links: dto.attributes.map((link) => ({
      attributeId: link.attributeId,
      code: link.code,
      name: link.name,
      inputType: link.inputType as AttributeInputType,
      role: link.role as AttributeRole,
      required: link.required,
      allValuesAllowed: link.allValuesAllowed,
      sizeRole: link.sizeRole,
      priceAffecting: link.priceAffecting,
      allowedValues: link.allowedValues.map((value) => ({
        id: value.valueId,
        name: value.name,
        colorCode: value.colorCode,
      })),
    })),
  }
}

/** 수정 화면: 목록에서 찾은 유형을 폼으로 (연결 순서 · 설정 그대로, 허용 값은 ID로) */
export function toProductTypeForm(type: ProductType): ProductTypeForm {
  return {
    name: type.name,
    links: type.links.map((link) => ({
      attributeId: link.attributeId,
      role: link.role,
      required: link.required,
      allValuesAllowed: link.allValuesAllowed,
      sizeRole: link.sizeRole,
      priceAffecting: link.priceAffecting,
      allowedValueIds: link.allowedValues.map((value) => value.id),
    })),
  }
}

/** 모든 값 허용이면 허용 값을 보내지 않는다 (BE는 둘 다 있으면 400). boolean 네 칸은 빠지면 400이라 늘 담는다 */
function toLinkRequest(link: ProductTypeLinkForm): ProductTypeLinkRequestDto {
  return {
    attributeId: link.attributeId,
    role: link.role,
    required: link.required,
    allValuesAllowed: link.allValuesAllowed,
    sizeRole: link.sizeRole,
    priceAffecting: link.priceAffecting,
    allowedValueIds: link.allValuesAllowed ? [] : link.allowedValueIds,
  }
}

export function toProductTypeCreateRequest(form: ProductTypeForm): ProductTypeCreateRequestDto {
  return { name: form.name.trim(), attributes: form.links.map(toLinkRequest) }
}

/** 수정은 이름 없이 연결 목록 전체를 폼 순서대로 보낸다 */
export function toProductTypeChangeRequest(form: ProductTypeForm): ProductTypeChangeRequestDto {
  return { attributes: form.links.map(toLinkRequest) }
}
