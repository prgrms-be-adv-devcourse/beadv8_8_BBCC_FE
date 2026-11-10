import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useCategoriesQuery } from '@/entities/product'
import {
  GARMENT_PARTS,
  categoriesForPart,
  useReferenceGarmentsQuery,
} from '@/entities/recommendation'
import { ReferenceGarmentEditor } from '@/features/manage-reference-garment'
import { getErrorMessage } from '@/shared/api'
import { REFERENCE_GARMENTS } from '@/shared/config'
import { MockBadge } from '@/shared/ui/MockBadge'
import { StateMessage } from '@/shared/ui/StateMessage'

const REFERENCE_GARMENT_ENDPOINTS = [
  'GET /recommendations/children/:childId/reference-garments',
  'PUT /recommendations/children/:childId/reference-garments/:part',
  'DELETE /recommendations/children/:childId/reference-garments/:part',
]

type ReferenceGarmentSectionProps = { childId: string }

/** 자녀 프로필의 기준 옷 칸: 상의 · 하의 두 칸 */
export function ReferenceGarmentSection({ childId }: ReferenceGarmentSectionProps) {
  const garments = useReferenceGarmentsQuery(childId)
  const categories = useCategoriesQuery()
  const { hash } = useLocation()
  const isReady = Boolean(garments.data && categories.data)

  // 맞춤 목록에서 #reference-garments로 오면 이 칸으로 내린다
  useEffect(() => {
    if (hash === `#${REFERENCE_GARMENTS}` && isReady)
      document.getElementById(REFERENCE_GARMENTS)?.scrollIntoView({ block: 'start' })
  }, [hash, isReady])

  return (
    <section
      id={REFERENCE_GARMENTS}
      aria-labelledby="reference-garments-title"
      className="border-rule scroll-mt-32 space-y-4 rounded-lg border p-4 md:p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="reference-garments-title" className="text-section">
          기준 옷
        </h2>
        <MockBadge endpoints={REFERENCE_GARMENT_ENDPOINTS} />
      </div>
      <p className="text-ink-3 text-[13px]">
        잘 맞게 입는 옷의 실측을 적어 두면, 사이즈 추천이 이 옷과 비교해요.
      </p>
      {(garments.isPending || categories.isPending) && <StateMessage>불러오는 중…</StateMessage>}
      {garments.isError && (
        <StateMessage tone="error">{getErrorMessage(garments.error)}</StateMessage>
      )}
      {categories.isError && (
        <StateMessage tone="error">{getErrorMessage(categories.error)}</StateMessage>
      )}
      {garments.data && categories.data && (
        <div className="grid gap-4 md:grid-cols-2">
          {GARMENT_PARTS.map((part) => {
            const garment = garments.data.find((item) => item.part === part) ?? null
            return (
              <ReferenceGarmentEditor
                key={`${part}-${JSON.stringify(garment)}`}
                childId={childId}
                part={part}
                garment={garment}
                categories={categoriesForPart(part, categories.data)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
