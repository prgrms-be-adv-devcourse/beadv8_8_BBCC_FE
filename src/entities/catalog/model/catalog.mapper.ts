import type { MeasurementItemDto, MeasurementItemRequestDto } from '../api/catalog.dto'
import type { MeasurementItem, MeasurementItemForm } from './catalog'

export function toMeasurementItem(dto: MeasurementItemDto): MeasurementItem {
  return { id: dto.measurementItemId, name: dto.name, code: dto.code, unit: dto.unit }
}

export function toMeasurementItemRequest(form: MeasurementItemForm): MeasurementItemRequestDto {
  return { name: form.name.trim(), code: form.code.trim(), unit: form.unit.trim() }
}
