import { useState, type FormEvent } from 'react'
import { SettlementRunSummary, useSettlementRunQuery } from '@/entities/settlement'
import { getErrorMessage } from '@/shared/api'
import { StateMessage } from '@/shared/ui/StateMessage'

/** 실행 번호로 정산 실행 결과를 다시 본다 (자동 정산 · 지난 실행 확인용) */
export function SettlementRunLookup() {
  const [runId, setRunId] = useState<string | null>(null)
  const run = useSettlementRunQuery(runId)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get('runId') ?? '').trim()
    setRunId(value || null)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="settlement-run-id" className="sr-only">
          실행 번호
        </label>
        <input
          id="settlement-run-id"
          name="runId"
          inputMode="numeric"
          pattern="\d+"
          placeholder="실행 번호"
          className="border-field-edge h-11 w-40 rounded-md border px-3 text-sm"
        />
        <button type="submit" className="shop-btn">
          조회
        </button>
      </form>
      {run.isError && <StateMessage tone="error">{getErrorMessage(run.error)}</StateMessage>}
      {run.data && <SettlementRunSummary run={run.data} />}
    </div>
  )
}
