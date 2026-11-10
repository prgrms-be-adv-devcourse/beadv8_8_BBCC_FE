import { useState, type FormEvent } from 'react'
import { productIdFromInput } from '@/entities/product'
import { confirmAction } from '@/shared/lib'
import { getErrorMessage } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { StateMessage } from '@/shared/ui/StateMessage'
import { useAdminRevertDelist } from '../model/use-manage-product'

/**
 * 관리자: 상품 번호로 등록 취소를 판매 중지로 되돌린다. 공개 목록은 판매 중 상품만 주고 관리자 상품 목록 API가 없어
 * 번호를 넣어 부른다. 등록 취소한 상품이 아니면 BE 설명(409)을 그대로 보여 준다
 */
export function AdminRevertDelistForm() {
  const revert = useAdminRevertDelist()
  const [input, setInput] = useState('')
  const [invalid, setInvalid] = useState<string | null>(null)
  const [reverted, setReverted] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const productId = productIdFromInput(input)
    setInvalid(productId ? null : '상품 번호를 숫자로 넣어 주세요.')
    if (!productId) return
    const isConfirmed = await confirmAction({
      title: `상품 #${productId}의 등록 취소를 되돌릴까요?`,
      description: '상품이 판매 중지 상태로 돌아가요. 다시 팔지는 판매자가 판매 시작으로 정해요.',
      confirmLabel: '되돌리기',
    })
    if (!isConfirmed) return
    setReverted(null)
    revert.mutate(productId, {
      onSuccess: () => {
        setReverted(productId)
        setInput('')
      },
    })
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="되돌릴 상품 번호"
          className="h-10 w-40"
          placeholder="상품 번호 (예: 100)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button
          type="submit"
          variant="outline"
          className="h-10 px-4"
          disabled={revert.isPending}
          aria-busy={revert.isPending}
        >
          등록 취소 되돌리기
        </Button>
      </div>
      {invalid && <StateMessage tone="error">{invalid}</StateMessage>}
      {revert.isError && <StateMessage tone="error">{getErrorMessage(revert.error)}</StateMessage>}
      {reverted && (
        <StateMessage>상품 #{reverted} 등록 취소를 되돌렸어요. 이제 판매 중지예요.</StateMessage>
      )}
    </form>
  )
}
