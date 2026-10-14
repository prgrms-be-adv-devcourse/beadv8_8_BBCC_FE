import * as React from 'react'
import { cn } from 'cn'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="label"
      className={cn('flex flex-col gap-1 text-sm font-medium', className)}
      {...props}
    />
  )
}

export { Label }
