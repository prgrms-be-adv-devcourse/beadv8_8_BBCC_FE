import type { CategoryInputs, SizeSpecInput } from '../model/product'
import { isFreeSize } from '../model/product.rules'
import { Input } from '@/shared/ui/input'

type SizeSpecTableProps = {
  /** 사이즈 항목에서 고른 값 */
  sizes: { id: string; name: string }[]
  measurementItems: CategoryInputs['measurementItems']
  /** 사이즈 값 ID → 권장 키 · 실측 */
  specs: Record<string, SizeSpecInput>
  onChange: (valueId: string, patch: Partial<SizeSpecInput>) => void
}

/** 사이즈마다 권장 키 · 실측 입력 (BE 판매 시작 조건: 필수 실측 전부, FREE가 아니면 권장 키) */
export function SizeSpecTable({ sizes, measurementItems, specs, onChange }: SizeSpecTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="사이즈별 권장 키 · 실측">
        <thead>
          <tr className="border-rule text-ink-3 border-b text-left text-[13px]">
            <th scope="col" className="py-2 pr-4 font-medium">
              사이즈
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              권장 키 (cm)
            </th>
            {measurementItems.map((item) => (
              <th key={item.code} scope="col" className="py-2 pr-4 font-medium whitespace-nowrap">
                {item.name} ({item.unit})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map((value) => {
            const spec = specs[value.id]
            return (
              <tr key={value.id} className="border-rule border-b">
                <td className="py-2 pr-4 font-semibold whitespace-nowrap">
                  {value.name}
                  {isFreeSize(value.name) && (
                    <span className="text-ink-3 block text-[13px] font-normal">권장 키 선택</span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  <span className="flex items-center gap-1">
                    <Input
                      aria-label={`${value.name} 권장 키 최소`}
                      type="number"
                      className="figure w-20"
                      value={spec?.minHeightCm ?? 0}
                      onChange={(e) => onChange(value.id, { minHeightCm: Number(e.target.value) })}
                    />
                    <span className="text-ink-3" aria-hidden>
                      ~
                    </span>
                    <Input
                      aria-label={`${value.name} 권장 키 최대`}
                      type="number"
                      className="figure w-20"
                      value={spec?.maxHeightCm ?? 0}
                      onChange={(e) => onChange(value.id, { maxHeightCm: Number(e.target.value) })}
                    />
                  </span>
                </td>
                {measurementItems.map((item) => (
                  <td key={item.code} className="py-2 pr-4">
                    <Input
                      aria-label={`${value.name} ${item.name}`}
                      type="number"
                      className="figure w-20"
                      value={spec?.measurements[item.code] ?? 0}
                      onChange={(e) =>
                        onChange(value.id, {
                          measurements: {
                            ...spec?.measurements,
                            [item.code]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
