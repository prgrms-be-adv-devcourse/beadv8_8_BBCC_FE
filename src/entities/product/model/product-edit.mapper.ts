import type { ProductUpdateRequestDto } from '../api/product.dto'
import type {
  CategoryInputs,
  InputAttribute,
  RegisterProductForm,
  SellerProductDetail,
  SizeSpecInput,
} from './product'
import { toRegisterProductRequest } from './product.mapper'
import { canEditSaleInputs } from './product.rules'

/** 고른 값들을 항목 순서로 맞춘 키 (등록 폼의 옵션 조합 · 가격 묶음 키와 같은 규칙) */
function keyOf(attributes: InputAttribute[], valueIds: string[]): string {
  return attributes
    .flatMap((attribute) =>
      valueIds.filter((valueId) => attribute.values.some((value) => value.id === valueId)),
    )
    .join(',')
}

function infoOf(inputs: CategoryInputs, detail: SellerProductDetail): RegisterProductForm['info'] {
  return Object.fromEntries(
    inputs.infoAttributes.map((attribute) => {
      const saved = detail.attributes.find((item) => item.attributeId === attribute.id)
      return [attribute.id, { valueId: saved?.valueIds[0] ?? '', text: saved?.text ?? '' }]
    }),
  )
}

function optionValuesOf(
  inputs: CategoryInputs,
  detail: SellerProductDetail,
): RegisterProductForm['optionValues'] {
  const used = new Set(detail.options.flatMap((option) => option.valueIds))
  return Object.fromEntries(
    inputs.optionAttributes.map((attribute) => [
      attribute.id,
      attribute.values.filter((value) => used.has(value.id)).map((value) => value.id),
    ]),
  )
}

function sizeSpecsOf(detail: SellerProductDetail): Record<string, SizeSpecInput> {
  return Object.fromEntries(
    detail.sizeSpecs.map((spec) => [
      spec.sizeValueId,
      {
        minHeightCm: spec.minHeightCm ?? 0,
        maxHeightCm: spec.maxHeightCm ?? 0,
        measurements: spec.measurements,
      },
    ]),
  )
}

/** 판매자 상세 → 등록 폼 값. 수정 화면은 등록 폼을 그대로 쓴다 (재고는 지금 수량) */
export function toEditableProductForm(
  inputs: CategoryInputs,
  detail: SellerProductDetail,
): RegisterProductForm {
  const priceAttributes = inputs.optionAttributes.filter((attribute) => attribute.priceAffecting)
  return {
    name: detail.name,
    brand: detail.brand ?? '',
    imageUrls: detail.imageUrls,
    categoryId: detail.categoryId,
    info: infoOf(inputs, detail),
    optionValues: optionValuesOf(inputs, detail),
    stocks: Object.fromEntries(
      detail.options.map((option) => [
        keyOf(inputs.optionAttributes, option.valueIds),
        option.stock,
      ]),
    ),
    prices: Object.fromEntries(
      detail.prices.map((group) => [keyOf(priceAttributes, group.valueIds), group.price]),
    ),
    sizeSpecs: sizeSpecsOf(detail),
  }
}

/** 이미 있는 옵션의 조합 키. 이 조합의 재고는 수정 폼이 아니라 재고 조정으로만 바꾼다 */
export function existingComboKeys(inputs: CategoryInputs, detail: SellerProductDetail): string[] {
  return detail.options.map((option) => keyOf(inputs.optionAttributes, option.valueIds))
}

type SavedAttribute = SellerProductDetail['attributes'][number]

/** 폼에서 손대지 않았는지 (폼은 목록 항목의 첫 값 하나만 보여 준다) */
function isUntouched(
  saved: SavedAttribute,
  input: RegisterProductForm['info'][string] | undefined,
) {
  return (
    (input?.valueId ?? '') === (saved.valueIds[0] ?? '') &&
    (input?.text ?? '') === (saved.text ?? '')
  )
}

/** 손대지 않은 정보 항목은 받은 값을 그대로 (여러 값을 고른 목록 항목이 지워지지 않게) */
function attributesOf(
  inputs: CategoryInputs,
  form: RegisterProductForm,
  detail: SellerProductDetail,
  fromForm: ProductUpdateRequestDto['attributes'],
): ProductUpdateRequestDto['attributes'] {
  return inputs.infoAttributes.flatMap((attribute) => {
    const saved = detail.attributes.find((item) => item.attributeId === attribute.id)
    if (saved && isUntouched(saved, form.info[attribute.id])) {
      return [
        {
          attributeId: Number(saved.attributeId),
          valueIds: saved.valueIds.map(Number),
          text: saved.text,
        },
      ]
    }
    return fromForm.filter((item) => item.attributeId === Number(attribute.id))
  })
}

/**
 * 수정 폼 → PUT 요청. 읽어 간 version을 보내고, 설명은 폼에 없어 받은 값을 그대로 보낸다.
 * 옵션 · 가격 · 실측은 판매 시작 전에만 셋을 함께 보내고, 그 밖에는 셋 다 null (BE는 보내면 409)
 */
export function toProductUpdateRequest(
  inputs: CategoryInputs,
  form: RegisterProductForm,
  detail: SellerProductDetail,
): ProductUpdateRequestDto {
  const request = toRegisterProductRequest(inputs, form)
  const canEdit = canEditSaleInputs(detail)
  return {
    ...request,
    version: detail.version,
    description: detail.description,
    attributes: attributesOf(inputs, form, detail, request.attributes),
    options: canEdit ? request.options : null,
    prices: canEdit ? request.prices : null,
    sizeSpecs: canEdit ? request.sizeSpecs : null,
  }
}
