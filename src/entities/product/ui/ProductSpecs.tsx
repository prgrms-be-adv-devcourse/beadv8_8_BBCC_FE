import type { ProductDetail } from '../model/product'
import { heightRange } from '../model/product.rules'

type ProductSpecsProps = { product: ProductDetail }

/** 상품 정보 항목 + 사이즈별 권장 키 · 실측 (BE 상세 productInfo · sizeSpecs) */
export function ProductSpecs({ product }: ProductSpecsProps) {
  const info = product.info.filter((item) => item.value)
  const items = product.sizeSpecs[0]?.measurements ?? []
  if (info.length === 0 && product.sizeSpecs.length === 0) return null
  return (
    <div className="space-y-3 text-sm">
      {info.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {info.map((item) => (
            <div key={item.name} className="contents">
              <dt className="text-muted-foreground">{item.name}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {product.sizeSpecs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" aria-label="사이즈 정보">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 pr-3 font-medium">사이즈</th>
                <th className="py-1 pr-3 font-medium">권장 키</th>
                {items.map((item) => (
                  <th key={item.name} className="py-1 pr-3 font-medium">
                    {item.name}({item.unit})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {product.sizeSpecs.map((spec) => (
                <tr key={spec.size} className="border-t">
                  <td className="py-1 pr-3 font-medium">{spec.size}</td>
                  <td className="py-1 pr-3">{heightRange(spec) ?? '—'}</td>
                  {spec.measurements.map((item) => (
                    <td key={item.name} className="py-1 pr-3">
                      {item.value ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
