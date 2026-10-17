import { ATTRIBUTE_INPUT_TYPE_LABEL, hasValueList, useAttributesQuery } from '@/entities/catalog'
import { AddAttributeValueForm, CreateAttributeForm } from '@/features/manage-catalog'
import { getErrorMessage } from '@/shared/api'
import { Badge } from '@/shared/ui/badge'
import { Card, CardTitle } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 항목 · 목록 값: 만들기 폼 + 목록 (항목마다 값 더하기) */
export function AttributesSection() {
  const attributes = useAttributesQuery()

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>항목 만들기</CardTitle>
        <CreateAttributeForm />
      </Card>
      {attributes.isPending && <StateMessage>불러오는 중…</StateMessage>}
      {attributes.isError && (
        <StateMessage tone="error">{getErrorMessage(attributes.error)}</StateMessage>
      )}
      {attributes.data?.length === 0 && <StateMessage>항목이 없어요.</StateMessage>}
      {attributes.data?.map((attribute) => (
        <Card key={attribute.id} className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{attribute.name}</span>
            <span className="text-muted-foreground">{attribute.code}</span>
            <Badge variant="muted">{ATTRIBUTE_INPUT_TYPE_LABEL[attribute.inputType]}</Badge>
          </div>
          {hasValueList(attribute.inputType) && (
            <>
              <div className="flex flex-wrap gap-1">
                {attribute.values.length === 0 && (
                  <span className="text-muted-foreground">목록 값이 없어요.</span>
                )}
                {attribute.values.map((value) => (
                  <Badge key={value.id} variant="muted" className="gap-1">
                    {value.colorCode && (
                      <span
                        aria-hidden
                        className="size-3 rounded-full border"
                        style={{ backgroundColor: value.colorCode }}
                      />
                    )}
                    {value.name}
                  </Badge>
                ))}
              </div>
              <AddAttributeValueForm attributeId={attribute.id} inputType={attribute.inputType} />
            </>
          )}
        </Card>
      ))}
    </div>
  )
}
