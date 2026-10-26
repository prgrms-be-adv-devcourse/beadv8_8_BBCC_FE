import { useState, type ReactNode } from 'react'
import { SELLER_STATUS_LABEL, useMySellerQuery } from '@/entities/seller'
import { EditBusinessNameForm } from '@/features/edit-seller-info'
import { getErrorMessage } from '@/shared/api'
import { cn } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StateMessage } from '@/shared/ui/StateMessage'

/**
 * 상점 정보: 쇼핑 「내 정보」처럼 「라벨 · 값 · 변경」 한 줄씩.
 * 상호명 수정은 그 줄 아래에서 펼친다
 */
export function CenterStorePage() {
  const seller = useMySellerQuery()
  const [editingName, setEditingName] = useState(false)

  return (
    <div className="shop-look max-w-2xl space-y-8">
      <PageHeader title="상점 정보" description="상호명을 바꾸고 판매 상태를 확인해요." />

      {seller.isPending && <StateMessage>내 판매자 정보를 불러오는 중…</StateMessage>}
      {seller.isError && <StateMessage tone="error">{getErrorMessage(seller.error)}</StateMessage>}
      {seller.data && (
        <section aria-label="상점" className="space-y-3">
          <h2 className="text-section">상점</h2>
          <dl className="border-rule divide-rule divide-y overflow-hidden rounded-lg border">
            <div>
              <InfoRow
                label="상호명"
                action={
                  !editingName && (
                    <button
                      type="button"
                      onClick={() => setEditingName(true)}
                      className="border-rule text-ink-2 hover:border-field-edge inline-flex h-9 shrink-0 items-center rounded-md border px-3 text-[13px] font-semibold transition-colors"
                    >
                      상호명 수정
                    </button>
                  )
                }
              >
                {seller.data.businessName}
              </InfoRow>
              {editingName && (
                <div className="bg-paper-2 px-5 pt-1 pb-5">
                  <EditBusinessNameForm
                    current={seller.data.businessName}
                    onDone={() => setEditingName(false)}
                  />
                </div>
              )}
            </div>
            <InfoRow label="판매자 번호">
              <span className="figure">{seller.data.id}</span>
            </InfoRow>
            <InfoRow label="판매 상태">
              <span
                className={cn(seller.data.status === 'ACTIVE' ? 'text-signal' : 'text-destructive')}
              >
                {SELLER_STATUS_LABEL[seller.data.status]}
              </span>
            </InfoRow>
          </dl>
        </section>
      )}
    </div>
  )
}

type InfoRowProps = { label: string; action?: ReactNode; children: ReactNode }

function InfoRow({ label, action, children }: InfoRowProps) {
  return (
    <div className="flex min-h-14 items-center gap-4 px-5 py-3">
      <dt className="text-ink-3 w-24 shrink-0 text-sm">{label}</dt>
      <dd className="text-ink min-w-0 flex-1 text-sm font-semibold break-all">{children}</dd>
      {action}
    </div>
  )
}
