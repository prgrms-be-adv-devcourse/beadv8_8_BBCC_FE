import type { ProductTypeCreateRequestDto, ProductTypeDto } from '../api/catalog.dto'
import type { AttributeInputType, AttributeRole, ProductType, ProductTypeForm } from './catalog'

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

/** 모든 값 허용이면 허용 값을 보내지 않는다 (BE는 둘 다 있으면 400) */
export function toProductTypeCreateRequest(form: ProductTypeForm): ProductTypeCreateRequestDto {
  return {
    name: form.name.trim(),
    attributes: form.links.map((link) => ({
      attributeId: link.attributeId,
      role: link.role,
      required: link.required,
      allValuesAllowed: link.allValuesAllowed,
      sizeRole: link.sizeRole,
      priceAffecting: link.priceAffecting,
      allowedValueIds: link.allValuesAllowed ? [] : link.allowedValueIds,
    })),
  }
}
