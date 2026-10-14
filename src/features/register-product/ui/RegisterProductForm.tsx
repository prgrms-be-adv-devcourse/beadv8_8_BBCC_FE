import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { CATEGORIES, productKeys } from '@/entities/product'
import { apiClient, getErrorMessage, runWithAction } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { Input, Select } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { StateMessage } from '@/shared/ui/page-header'

type SizeRow = {
  size: string
  minHeightCm: number
  maxHeightCm: number
  price: number
  stock: number
}

/** 상품 등록 (목 API). 옵션 = 색상 × 소재 × 사이즈, 사이즈마다 권장 키 */
export function RegisterProductForm() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('데일리 맨투맨')
  const [categoryId, setCategoryId] = useState('1')
  const [color, setColor] = useState('네이비')
  const [material, setMaterial] = useState('면')
  const [rows, setRows] = useState<SizeRow[]>([
    { size: '110', minHeightCm: 105, maxHeightCm: 115, price: 25000, stock: 10 },
    { size: '120', minHeightCm: 115, maxHeightCm: 125, price: 25000, stock: 10 },
  ])

  const register = useMutation({
    mutationFn: () =>
      runWithAction('상품 등록', () =>
        apiClient.post('/seller/products', {
          name,
          categoryId,
          description: '',
          options: rows.map((row) => ({ ...row, color, material })),
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.sellerList }),
  })

  const updateRow = (index: number, patch: Partial<SizeRow>) =>
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    register.mutate()
  }

  return (
    <Card>
      <CardTitle className="mb-3">상품 등록</CardTitle>
      <form className="space-y-3" onSubmit={submit}>
        <div className="grid grid-cols-4 gap-3">
          <Label className="col-span-2">
            상품명
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Label>
          <Label>
            카테고리
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {CATEGORIES.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Label>
              색상
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </Label>
            <Label>
              소재
              <Input value={material} onChange={(e) => setMaterial(e.target.value)} />
            </Label>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-left">
            <tr>
              <th>사이즈</th>
              <th>권장 키 (cm)</th>
              <th>가격</th>
              <th>재고</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="pr-2">
                  <Input
                    value={row.size}
                    onChange={(e) => updateRow(index, { size: e.target.value })}
                  />
                </td>
                <td className="flex items-center gap-1 pr-2">
                  <Input
                    type="number"
                    value={row.minHeightCm}
                    onChange={(e) => updateRow(index, { minHeightCm: Number(e.target.value) })}
                  />
                  ~
                  <Input
                    type="number"
                    value={row.maxHeightCm}
                    onChange={(e) => updateRow(index, { maxHeightCm: Number(e.target.value) })}
                  />
                </td>
                <td className="pr-2">
                  <Input
                    type="number"
                    value={row.price}
                    onChange={(e) => updateRow(index, { price: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <Input
                    type="number"
                    value={row.stock}
                    onChange={(e) => updateRow(index, { stock: Number(e.target.value) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                { size: '', minHeightCm: 0, maxHeightCm: 0, price: 0, stock: 0 },
              ])
            }
          >
            사이즈 추가
          </Button>
          <Button type="submit" disabled={register.isPending}>
            등록하기
          </Button>
          {register.isError && (
            <StateMessage tone="error">{getErrorMessage(register.error)}</StateMessage>
          )}
          {register.isSuccess && (
            <StateMessage>등록했어요. 아래에서 판매를 시작하세요.</StateMessage>
          )}
        </div>
      </form>
    </Card>
  )
}
