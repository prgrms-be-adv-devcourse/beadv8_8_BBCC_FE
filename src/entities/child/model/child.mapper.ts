import type { ChildProfileDto, ChildProfileRequestDto, GrowthRecordDto } from '../api/child.dto'
import type { BodyType, Child, ChildForm, Gender, GrowthRecord, PreferredFit } from './child'

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

/** 수정 폼 초기값 (수정은 전체 교체라 모든 입력 항목을 채운다) */
export function toChildForm(child: Child): ChildForm {
  return {
    name: child.name,
    birthDate: child.birthDate,
    gender: child.gender,
    heightCm: child.heightCm,
    weightKg: child.weightKg,
    bodyType: child.bodyType,
    preferredFit: child.preferredFit,
  }
}

export function toGrowthRecord(dto: GrowthRecordDto): GrowthRecord {
  return {
    id: String(dto.id),
    heightCm: dto.heightCm,
    bodyType: dto.bodyType as BodyType | null,
    recordedAt: dto.recordedAt,
  }
}
