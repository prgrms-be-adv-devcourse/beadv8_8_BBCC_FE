import type {
  AttributeCreateRequestDto,
  AttributeDto,
  AttributeValueRequestDto,
  MeasurementItemDto,
  MeasurementItemRequestDto,
} from '../api/catalog.dto'
import type {
  Attribute,
  AttributeForm,
  AttributeInputType,
  AttributeValueForm,
  MeasurementItem,
  MeasurementItemForm,
} from './catalog'
import { hasValueList, needsColorCode } from './catalog.rules'

export function toAttribute(dto: AttributeDto): Attribute {
  return {
    id: dto.attributeId,
    name: dto.name,
    code: dto.code,
    // 정해지지 않은 값은 계약 검사(흐름 패널)가 드러낸다
    inputType: dto.inputType as AttributeInputType,
    values: dto.values.map((value) => ({
      id: value.valueId,
      name: value.name,
      colorCode: value.colorCode,
    })),
  }
}

export function toMeasurementItem(dto: MeasurementItemDto): MeasurementItem {
  return { id: dto.measurementItemId, name: dto.name, code: dto.code, unit: dto.unit }
}

export function toAttributeValueRequest(
  value: AttributeValueForm,
  inputType: AttributeInputType,
): AttributeValueRequestDto {
  return {
    name: value.name.trim(),
    colorCode: needsColorCode(inputType) ? value.colorCode.trim() : null,
  }
}

export function toAttributeCreateRequest(form: AttributeForm): AttributeCreateRequestDto {
  return {
    name: form.name.trim(),
    code: form.code.trim(),
    inputType: form.inputType,
    values: hasValueList(form.inputType)
      ? form.values.map((value) => toAttributeValueRequest(value, form.inputType))
      : [],
  }
}

export function toMeasurementItemRequest(form: MeasurementItemForm): MeasurementItemRequestDto {
  return { name: form.name.trim(), code: form.code.trim(), unit: form.unit.trim() }
}
