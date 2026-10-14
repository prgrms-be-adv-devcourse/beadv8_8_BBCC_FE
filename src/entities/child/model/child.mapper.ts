import type { ChildProfileDto, ChildProfileRequestDto } from '../api/child.dto'
import type { BodyType, Child, ChildForm, Gender, PreferredFit } from './child'

export function toChild(dto: ChildProfileDto): Child {
  return {
    id: String(dto.id),
    name: dto.name,
    birthDate: dto.birthDate,
    gender: dto.gender as Gender,
    heightCm: dto.heightCm,
    weightKg: dto.weightKg,
    bodyType: dto.bodyType as BodyType | null,
    preferredFit: dto.preferredFit as PreferredFit | null,
    growthRecordCount: dto.growthRecordCount,
  }
}

export function toChildRequest(form: ChildForm): ChildProfileRequestDto {
  return { ...form, name: form.name.trim() }
}
