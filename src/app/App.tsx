import { RouterProvider } from 'react-router/dom'
import { QueryProvider } from '@/app/QueryProvider'
import { router } from '@/app/router'

export function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}
