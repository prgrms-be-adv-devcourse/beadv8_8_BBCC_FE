import type { RegisterProductForm } from '@/entities/product'

export const DEMO_PRODUCT: RegisterProductForm = {
  name: '데일리 맨투맨',
  categoryId: '1',
  color: '네이비',
  material: '면',
  sizes: [
    { size: '110', minHeightCm: 105, maxHeightCm: 115, price: 25000, stock: 10 },
    { size: '120', minHeightCm: 115, maxHeightCm: 125, price: 25000, stock: 10 },
  ],
}

export const EMPTY_SIZE_ROW = { size: '', minHeightCm: 0, maxHeightCm: 0, price: 0, stock: 0 }
