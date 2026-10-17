import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { AttributesSection } from './AttributesSection'
import { MeasurementItemsSection } from './MeasurementItemsSection'

const TABS = {
  attributes: { label: '항목 · 목록 값', Section: AttributesSection },
  measurementItems: { label: '실측 항목', Section: MeasurementItemsSection },
} as const

type Tab = keyof typeof TABS

/** 관리자: 판매자가 상품을 등록할 때 고르는 기준 데이터를 보고 추가 (삭제 · 이름 수정은 아직 없음) */
export function AdminCatalogPage() {
  const [tab, setTab] = useState<Tab>('attributes')
  const { Section } = TABS[tab]

  return (
    <div className="space-y-4">
      <PageHeader
        title="상품 기준 데이터"
        description="판매자가 상품을 등록할 때 고르는 항목과 실측 항목을 보고 추가해요. 이미 만든 코드는 바꿀 수 없어요."
        note="POST · GET /admin/attributes, POST /admin/attributes/{id}/values, POST · GET /admin/measurement-items. 코드는 상품 목록 필터 · 실측 값의 키라 대문자와 _만 받고, 겹치면 409"
      />
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TABS) as Tab[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? 'default' : 'outline'}
            onClick={() => setTab(key)}
          >
            {TABS[key].label}
          </Button>
        ))}
      </div>
      <Section />
    </div>
  )
}
