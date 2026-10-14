import * as React from 'react'
import { cn } from 'cn'

// shadcn 레지스트리에 접속할 수 없어 같은 모양으로 직접 둔 컴포넌트 (input · select · textarea)
function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'border-input focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive h-8 w-full min-w-0 rounded-lg border bg-white px-2.5 text-sm outline-none focus-visible:ring-3 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="select"
      className={cn(
        'border-input focus-visible:border-ring focus-visible:ring-ring/30 h-8 w-full rounded-lg border bg-white px-2 text-sm outline-none focus-visible:ring-3 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input, Select }
