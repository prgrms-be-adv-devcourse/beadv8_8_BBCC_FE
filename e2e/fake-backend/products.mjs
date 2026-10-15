// 가짜 백엔드의 상품 도메인: 카테고리 · 입력 항목 · 등록 · 판매 시작 · 상세 (BE in/** 응답 모양만 흉내).
// 기준 데이터는 BE 테스트 픽스처(의류 > 상의 · 하의, 색상 · 사이즈 옵션, 주요소재 · 혼용률 정보, 실측)를 따른다.
// 판매를 시작하면 주문 도메인 상품 복사본(replica)과 재고(stock)를 만든다 (product.changed 흉내).

const attrs = {
  1: {
    attributeId: '1',
    code: 'COLOR',
    name: '색상',
    inputType: 'PALETTE',
    role: 'OPTION',
    required: true,
    sizeRole: false,
    priceAffecting: false,
  },
  2: {
    attributeId: '2',
    code: 'SIZE',
    name: '사이즈',
    inputType: 'LIST',
    role: 'OPTION',
    required: true,
    sizeRole: true,
    priceAffecting: false,
  },
  3: {
    attributeId: '3',
    code: 'MAIN_MATERIAL',
    name: '주요소재',
    inputType: 'LIST',
    role: 'INFO',
    required: true,
    sizeRole: false,
    priceAffecting: false,
  },
  4: {
    attributeId: '4',
    code: 'FABRIC_COMPOSITION',
    name: '혼용률',
    inputType: 'TEXT',
    role: 'INFO',
    required: false,
    sizeRole: false,
    priceAffecting: false,
  },
}
const values = {
  101: { attributeId: '1', value: '네이비', colorCode: '#1F2A44' },
  102: { attributeId: '1', value: '그레이', colorCode: '#9CA3AF' },
  103: { attributeId: '1', value: '아이보리', colorCode: '#F5F0E6' },
  201: { attributeId: '2', value: '100', colorCode: null },
  202: { attributeId: '2', value: '110', colorCode: null },
  203: { attributeId: '2', value: '120', colorCode: null },
  204: { attributeId: '2', value: '130', colorCode: null },
  301: { attributeId: '3', value: '면', colorCode: null },
  302: { attributeId: '3', value: '폴리에스터', colorCode: null },
}
const measurement = (code, name) => ({ code, name, unit: 'cm' })
const leaves = {
  11: {
    name: '상의',
    items: [
      measurement('TOTAL_LENGTH', '총장'),
      measurement('SHOULDER_WIDTH', '어깨너비'),
      measurement('CHEST_WIDTH', '가슴단면'),
      measurement('SLEEVE_LENGTH', '소매길이'),
    ],
  },
  12: {
    name: '하의',
    items: [measurement('TOTAL_LENGTH', '총장'), measurement('WAIST_WIDTH', '허리단면')],
  },
}
export const categoryTree = [
  {
    categoryId: '10',
    name: '의류',
    leaf: false,
    children: Object.entries(leaves).map(([id, leaf]) => ({
      categoryId: id,
      name: leaf.name,
      leaf: true,
      children: [],
    })),
  },
]

const valueOut = (id) => ({
  valueId: String(id),
  value: values[id].value,
  colorCode: values[id].colorCode,
})

export function categoryInputs(categoryId) {
  const leaf = leaves[categoryId]
  if (!leaf) return null
  return {
    categoryId: String(categoryId),
    categoryName: leaf.name,
    productTypeId: '1',
    productTypeName: '의류',
    attributes: Object.values(attrs).map((a) => ({
      ...a,
      values: Object.keys(values)
        .filter((v) => values[v].attributeId === a.attributeId)
        .map(valueOut),
    })),
    measurementItems: leaf.items,
  }
}

// 주문 쪽 상품 복사본 · 상품 쪽 재고 (server.mjs가 장바구니 · 주문에서 쓴다)
export const replica = {}
export const stock = {}

let nextProductId = 100
let nextOptionId = 1000
const products = {}

const optionNameOf = (valueIds) => valueIds.map((v) => values[v].value).join(' / ')
const sizeOf = (valueIds) =>
  valueIds
    .map(String)
    .map(Number)
    .find((v) => values[v]?.attributeId === '2')

function startSale(product) {
  product.status = 'ON_SALE'
  product.version += 1
  for (const o of product.options) {
    const size = sizeOf(o.valueIds)
    replica[o.optionId] = {
      productId: product.productId,
      name: product.name,
      optionName: optionNameOf(o.valueIds),
      size: size ? values[size].value : null,
      price: o.price,
      sellerId: product.sellerId,
    }
  }
}

function seed(productId, name, categoryId, options, sizeSpecs) {
  products[productId] = {
    productId,
    sellerId: 2,
    name,
    brand: null,
    categoryId,
    status: 'SALE_PENDING',
    version: 0,
    imageUrls: [],
    info: [{ attributeId: 3, valueIds: [301], text: null }],
    options,
    sizeSpecs,
  }
  options.forEach((o) => (stock[o.optionId] = o.qty))
  startSale(products[productId])
}
// 기획서 7.1 시연 데이터: 상품 A(옵션 1 · 2 각 10), 상품 B(옵션 3, 5) — 이미 판매 중
seed(
  '1',
  '데일리 맨투맨 (상품 A)',
  11,
  [
    { optionId: 1, valueIds: [101, 202], price: 25000, qty: 10 },
    { optionId: 2, valueIds: [101, 203], price: 25000, qty: 10 },
  ],
  [
    {
      sizeValueId: 202,
      minHeightCm: 105,
      maxHeightCm: 115,
      measurements: { TOTAL_LENGTH: 42, SHOULDER_WIDTH: 30, CHEST_WIDTH: 34, SLEEVE_LENGTH: 38 },
    },
    {
      sizeValueId: 203,
      minHeightCm: 115,
      maxHeightCm: 125,
      measurements: { TOTAL_LENGTH: 45, SHOULDER_WIDTH: 32, CHEST_WIDTH: 36, SLEEVE_LENGTH: 41 },
    },
  ],
)
seed(
  '2',
  '밴딩 조거 팬츠 (상품 B)',
  12,
  [{ optionId: 3, valueIds: [102, 203], price: 30000, qty: 5 }],
  [
    {
      sizeValueId: 203,
      minHeightCm: 115,
      maxHeightCm: 125,
      measurements: { TOTAL_LENGTH: 60, WAIST_WIDTH: 26 },
    },
  ],
)

/**
 * GET /products (BE ProductListItemResponse). 판매 중만, 품절도 남는다, 최신순.
 * keyword는 상품명 포함, categoryId는 그 카테고리 또는 상위(의류 10)
 */
export function listOf(query) {
  const keyword = (query.get('keyword') ?? '').trim()
  const categoryId = query.get('categoryId')
  const sort = query.get('sort') ?? 'NEWEST'
  // attributes=COLOR:101&attributes=SIZE:203 → 항목코드별 값 묶음 (같은 항목은 하나만, 다른 항목끼리는 모두)
  const wanted = {}
  for (const pair of query.getAll('attributes')) {
    const [code, valueId] = pair.split(':')
    ;(wanted[code] ??= []).push(Number(valueId))
  }
  const codeOf = (valueId) => attrs[values[valueId]?.attributeId]?.code
  const matches = (p) =>
    Object.entries(wanted).every(([code, ids]) =>
      p.options.some((o) => o.valueIds.some((v) => codeOf(v) === code && ids.includes(Number(v)))),
    )
  const minPriceOf = (p) => Math.min(...p.options.map((o) => o.price))
  return Object.values(products)
    .filter((p) => p.status === 'ON_SALE')
    .filter((p) => !keyword || p.name.includes(keyword))
    .filter((p) => !categoryId || categoryId === '10' || String(p.categoryId) === categoryId)
    .filter(matches)
    .sort((a, b) =>
      sort === 'PRICE_ASC'
        ? minPriceOf(a) - minPriceOf(b)
        : sort === 'PRICE_DESC'
          ? minPriceOf(b) - minPriceOf(a)
          : Number(b.productId) - Number(a.productId),
    )
    .map((p) => ({
      productId: p.productId,
      name: p.name,
      thumbnailUrl: p.imageUrls[0] ?? null,
      businessName: '테스트상점',
      minPrice: Math.min(...p.options.map((o) => o.price)),
      soldOut: p.options.every((o) => (stock[o.optionId] ?? 0) <= 0),
      sizeFree: !p.options.some((o) => sizeOf(o.valueIds)),
    }))
}

export function detailOf(productId) {
  const p = products[productId]
  if (!p || p.status === 'SALE_PENDING') return null
  const used = [...new Set(p.options.flatMap((o) => o.valueIds))].sort((a, b) => a - b)
  return {
    productId: p.productId,
    name: p.name,
    brand: p.brand,
    categoryId: String(p.categoryId),
    status: p.status,
    sizeFree: !p.options.some((o) => sizeOf(o.valueIds)),
    minPrice: p.options.length ? Math.min(...p.options.map((o) => o.price)) : null,
    imageUrls: p.imageUrls,
    optionAttributes: ['1', '2'].map((attributeId) => ({
      attributeId,
      code: attrs[attributeId].code,
      name: attrs[attributeId].name,
      values: used.filter((v) => values[v].attributeId === attributeId).map(valueOut),
    })),
    options: p.options.map((o) => {
      const qty = stock[o.optionId] ?? 0
      return {
        optionId: String(o.optionId),
        optionName: optionNameOf(o.valueIds),
        valueIds: o.valueIds.map(String),
        price: o.price,
        purchasable: qty > 0,
        stockStatus: qty === 0 ? 'SOLD_OUT' : qty <= 5 ? 'LOW' : 'AVAILABLE',
        stockQuantity: qty > 0 && qty <= 5 ? qty : null,
      }
    }),
    productInfo: [
      {
        code: 'MAIN_MATERIAL',
        name: '주요소재',
        value: values[p.info.find((i) => i.attributeId === 3)?.valueIds[0]]?.value ?? null,
      },
      {
        code: 'FABRIC_COMPOSITION',
        name: '혼용률',
        value: p.info.find((i) => i.attributeId === 4)?.text ?? null,
      },
    ],
    sizeSpecs: p.sizeSpecs.map((s) => ({
      size: values[s.sizeValueId].value,
      minHeightCm: s.minHeightCm,
      maxHeightCm: s.maxHeightCm,
      measurements: s.measurements,
    })),
    measurementItems: leaves[p.categoryId].items,
  }
}

/** POST /seller/products. 실패면 { status, detail } */
export function register(sellerId, body) {
  const categoryId = Number(body.categoryId)
  if (!leaves[categoryId]) return { status: 404, detail: '카테고리를 찾을 수 없습니다.' }
  if (!body.name?.trim()) return { status: 400, detail: '상품명을 입력해 주세요.' }
  // BE ProductRegisterRequest는 ID를 Long으로 받는다. 문자열로 오면 막아 FE 회귀를 E2E가 잡게 한다
  const sent = [
    ...body.attributes.flatMap((a) => [a.attributeId, ...a.valueIds]),
    ...body.options.flatMap((o) => o.valueIds),
    ...body.prices.flatMap((g) => g.valueIds),
    ...body.sizeSpecs.map((s) => s.sizeValueId),
  ]
  if (sent.some((id) => typeof id !== 'number'))
    return { status: 400, detail: '항목 · 값 ID는 숫자로 보내 주세요.' }
  const ids = (list) => list.map(Number)
  const options = body.options.map((o) => {
    const valueIds = ids(o.valueIds)
    const group = body.prices.find((g) => ids(g.valueIds).every((v) => valueIds.includes(v)))
    return {
      optionId: nextOptionId++,
      valueIds,
      price: group?.price ?? 0,
      qty: o.initialQuantity,
      skuCode: o.skuCode,
    }
  })
  if (options.length === 0)
    return { status: 400, detail: '판매를 시작할 수 없습니다. 옵션이 하나 이상 있어야 합니다.' }
  for (const o of options) {
    if (o.valueIds.length !== 2)
      return { status: 400, detail: '옵션 항목마다 값을 하나씩 골라 주세요.' }
    const size = sizeOf(o.valueIds)
    const spec = body.sizeSpecs.find((s) => Number(s.sizeValueId) === size)
    if (!spec?.minHeightCm)
      return {
        status: 400,
        detail: `판매를 시작할 수 없습니다. ${values[size].value} 사이즈에 실측과 권장 키가 없습니다.`,
      }
  }
  const product = {
    productId: String(nextProductId++),
    sellerId,
    name: body.name.trim(),
    brand: body.brand,
    categoryId,
    status: 'SALE_PENDING',
    version: 0,
    imageUrls: body.imageUrls,
    info: body.attributes.map((a) => ({
      attributeId: Number(a.attributeId),
      valueIds: ids(a.valueIds),
      text: a.text,
    })),
    options,
    sizeSpecs: body.sizeSpecs.map((s) => ({ ...s, sizeValueId: Number(s.sizeValueId) })),
  }
  products[product.productId] = product
  options.forEach((o) => (stock[o.optionId] = o.qty))
  return {
    status: 201,
    location: `/api/v1/seller/products/${product.productId}`,
    body: {
      productId: product.productId,
      status: product.status,
      version: product.version,
      options: options.map((o) => ({
        optionId: String(o.optionId),
        optionName: optionNameOf(o.valueIds),
        price: o.price,
        availableQuantity: o.qty,
        saleStatus: 'ON_SALE',
        skuCode: o.skuCode ?? null,
      })),
    },
  }
}

const saleStatusBody = (p) => ({ productId: p.productId, status: p.status, version: p.version })

/** 판매 시작(ON_SALE) · 중지(STOPPED) 공통 (BE #315). 같은 상태면 그대로 200 */
function applySaleStatus(p, status, byAdmin) {
  if (status !== 'ON_SALE' && status !== 'STOPPED')
    return {
      status: 400,
      detail: '판매 시작(ON_SALE)이나 판매 중지(STOPPED)만 요청할 수 있습니다.',
    }
  if (status === 'STOPPED') {
    if (p.status === 'SALE_PENDING')
      return { status: 409, detail: '판매를 시작한 상품만 판매를 중지할 수 있습니다.' }
    if (p.status !== 'STOPPED') {
      p.status = 'STOPPED'
      p.version += 1
    }
    if (byAdmin) p.stoppedByAdmin = true
    return { status: 200, body: saleStatusBody(p) }
  }
  if (p.stoppedByAdmin && !byAdmin)
    return { status: 409, detail: '관리자가 판매중지한 상품은 다시 판매할 수 없습니다.' }
  p.stoppedByAdmin = false
  if (p.status !== 'ON_SALE') startSale(p)
  return { status: 200, body: saleStatusBody(p) }
}

/** PUT /seller/products/{id}/sale-status */
export function changeSaleStatus(sellerId, productId, body) {
  const p = products[productId]
  if (!p) return { status: 404, detail: '상품을 찾을 수 없습니다.' }
  if (p.sellerId !== sellerId)
    return { status: 403, detail: '내 상품만 판매 상태를 바꿀 수 있습니다.' }
  return applySaleStatus(p, body?.status, false)
}

/** PUT /admin/products/{id}/sale-status */
export function adminChangeSaleStatus(productId, body) {
  const p = products[productId]
  if (!p) return { status: 404, detail: '상품을 찾을 수 없습니다.' }
  return applySaleStatus(p, body?.status, true)
}

const createdAtOf = (p) =>
  new Date(Date.UTC(2026, 9, 1) + Number(p.productId) * 60000).toISOString().slice(0, 19)

/** GET /seller/products (BE SellerProductSummaryResponse). 등록 최신순 */
export function sellerListOf(sellerId) {
  return Object.values(products)
    .filter((p) => p.sellerId === sellerId)
    .sort((a, b) => Number(b.productId) - Number(a.productId))
    .map((p) => {
      const prices = p.options.map((o) => o.price)
      return {
        productId: String(p.productId),
        name: p.name,
        thumbnailUrl: p.imageUrls[0] ?? null,
        status: p.status,
        optionCount: p.options.length,
        totalAvailableQuantity: p.options.reduce((sum, o) => sum + (stock[o.optionId] ?? 0), 0),
        minPrice: prices.length > 0 ? Math.min(...prices) : null,
        createdAt: createdAtOf(p),
      }
    })
}

/** GET /seller/products/{id} (BE SellerProductDetailResponse). 남의 상품이면 404 */
export function sellerDetailOf(sellerId, productId) {
  const p = products[productId]
  if (!p || p.sellerId !== sellerId) return null
  return {
    productId: String(p.productId),
    name: p.name,
    status: p.status,
    version: p.version,
    options: p.options.map((o) => ({
      optionId: String(o.optionId),
      optionName: optionNameOf(o.valueIds),
      price: o.price,
      availableQuantity: stock[o.optionId] ?? 0,
      saleStatus: 'ON_SALE',
      skuCode: o.skuCode ?? null,
    })),
  }
}

const INCREASE_ONLY = ['RESTOCK']
const DECREASE_ONLY = ['DEFECTIVE', 'LOST']

/** POST /seller/options/{optionId}/inventory-adjustments (BE InventoryAdjustmentSignValidator 흉내) */
export function adjustInventory(sellerId, optionId, body) {
  const p = Object.values(products).find((item) =>
    item.options.some((o) => String(o.optionId) === String(optionId)),
  )
  if (!p || p.sellerId !== sellerId) return { status: 404, detail: '옵션을 찾을 수 없습니다.' }
  const option = p.options.find((o) => String(o.optionId) === String(optionId))
  const delta = body?.deltaQuantity
  const reason = body?.reason
  if (!Number.isInteger(delta) || delta === 0)
    return { status: 400, detail: '조정 수량은 0이 아닌 정수여야 합니다.' }
  if (![...INCREASE_ONLY, ...DECREASE_ONLY, 'CORRECTION'].includes(reason))
    return { status: 400, detail: '조정 사유를 확인해 주세요.' }
  if (
    (INCREASE_ONLY.includes(reason) && delta < 0) ||
    (DECREASE_ONLY.includes(reason) && delta > 0)
  )
    return { status: 400, detail: '사유와 조정 방향이 맞지 않습니다.' }
  const current = stock[option.optionId] ?? 0
  if (current + delta < 0) return { status: 409, detail: '재고가 부족합니다.' }
  stock[option.optionId] = current + delta
  return {
    status: 200,
    body: {
      optionId: String(option.optionId),
      reason,
      deltaQuantity: delta,
      availableQuantity: stock[option.optionId],
    },
  }
}
