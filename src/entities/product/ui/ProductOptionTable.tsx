import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import type { ValueCombo } from '../model/product'

type ProductOptionTableProps = {
  /** 남은 옵션 조합 */
  combos: ValueCombo[]
  stocks: Record<string, number>
  skuCodes: Record<string, string>
  /** 이미 있는 옵션 조합 → 지금 재고. 재고는 재고 조정으로만 바꾸므로 입력 칸 대신 보여만 준다 (수정) */
  fixedStocks: Record<string, number>
  /** 뺀 조합 수. 있으면 다시 넣기 버튼을 보여 준다 */
  removedCount: number
  onStock: (comboKey: string, stock: number) => void
  onSkuCode: (comboKey: string, skuCode: string) => void
  onRemove: (comboKey: string) => void
  onRestore: () => void
}

/** 옵션 목록: 조합마다 처음 재고 · SKU 코드(선택), 팔지 않을 조합은 뺀다 */
export function ProductOptionTable({
  combos,
  stocks,
  skuCodes,
  fixedStocks,
  removedCount,
  onStock,
  onSkuCode,
  onRemove,
  onRestore,
}: ProductOptionTableProps) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">옵션 목록 ({combos.length}개)</p>
        {removedCount > 0 && (
          <Button type="button" size="sm" variant="ghost" onClick={onRestore}>
            뺀 옵션 {removedCount}개 다시 넣기
          </Button>
        )}
      </div>
      {combos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="옵션 목록">
            <thead className="text-muted-foreground text-left">
              <tr>
                <th className="font-medium">옵션 이름</th>
                <th className="font-medium">
                  {Object.keys(fixedStocks).length > 0 ? '재고 (새 옵션은 처음 재고)' : '처음 재고'}
                </th>
                <th className="font-medium">
                  SKU 코드 (선택) · 판매자 관리용, 구매자에게 보이지 않아요
                </th>
                <th className="font-medium">빼기</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo) => (
                <tr key={combo.key}>
                  <td className="pr-2">{combo.label}</td>
                  <td className="pr-2">
                    {combo.key in fixedStocks ? (
                      <span className="text-muted-foreground">재고 {fixedStocks[combo.key]}</span>
                    ) : (
                      <Input
                        aria-label={`${combo.label} 재고`}
                        type="number"
                        min={0}
                        className="w-24"
                        value={stocks[combo.key] ?? 0}
                        onChange={(e) => onStock(combo.key, Number(e.target.value))}
                      />
                    )}
                  </td>
                  <td className="pr-2">
                    <Input
                      aria-label={`${combo.label} SKU 코드`}
                      placeholder="선택"
                      maxLength={255}
                      className="w-48"
                      value={skuCodes[combo.key] ?? ''}
                      onChange={(e) => onSkuCode(combo.key, e.target.value)}
                    />
                  </td>
                  <td>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`${combo.label} 빼기`}
                      onClick={() => onRemove(combo.key)}
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-muted-foreground text-xs">재고는 0이어도 판매를 시작할 수 있어요.</p>
    </div>
  )
}
