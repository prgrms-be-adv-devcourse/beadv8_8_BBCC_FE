import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { canSendWishLine, type WishLine } from '@/entities/wish'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatWon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { useChildWishSelection } from '../model/use-child-wish-selection'
import { useSendChildWish } from '../model/use-send-child-wish'

type SendChildWishProps = { items: WishLine[]; renderRemove: (item: WishLine) => ReactNode }
export function SendChildWish({ items, renderRemove }: SendChildWishProps) {
  const { ids, isSelected, toggle, clear } = useChildWishSelection(items)
  const [message, setMessage] = useState('')
  const send = useSendChildWish()
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.wishItemId} className="space-y-2 border p-4">
          <label>
            <input
              type="checkbox"
              checked={isSelected(item.wishItemId)}
              disabled={!canSendWishLine(item)}
              onChange={() => toggle(item.wishItemId)}
            />{' '}
            {item.productName} · {item.optionName} · {item.size}
          </label>
          <p>
            {item.quantity}개 · {formatWon(item.lineAmount)} ·{' '}
            {item.addedBy === 'CHILD' ? '나' : '보호자'}
          </p>
          {!item.purchasable && <p>구매할 수 없어요.</p>}
          {item.requestId && <p>진행 중인 조르기에 담겨 있어요.</p>}
          {renderRemove(item)}
        </div>
      ))}
      <label>
        메시지{' '}
        <input
          value={message}
          maxLength={100}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <p>{message.length}/100</p>
      <Button
        disabled={!ids.length || send.isPending}
        onClick={() =>
          send.mutate(
            { ids, message },
            {
              onSuccess: () => {
                clear()
                setMessage('')
              },
            },
          )
        }
      >
        조르기 보내기
      </Button>
      {send.isError && <p role="alert">{getErrorMessage(send.error)}</p>}
      {send.isSuccess && (
        <p>
          보냈어요. <Link to={paths.child.wishes}>내 조르기 보기</Link>
        </p>
      )}
    </div>
  )
}
