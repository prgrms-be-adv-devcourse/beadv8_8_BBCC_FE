import { ProductImage } from './ProductImage'

type ProductDescriptionProps = {
  /** 판매자가 쓴 설명. 없으면 null */
  description: string | null
  /** 상세 사진 (대표 제외) */
  images: string[]
  alt: string
}

/** 상품 설명: 설명 글(줄바꿈 그대로) 아래에 상세 사진을 원래 비율로 모두 쌓는다. 둘 다 없으면 그리지 않는다 */
export function ProductDescription({ description, images, alt }: ProductDescriptionProps) {
  if (!description && images.length === 0) return null
  return (
    <section aria-labelledby="product-description" className="space-y-4 border-t pt-6">
      <h2 id="product-description" className="text-lg font-semibold">
        상품 설명
      </h2>
      {description && <p className="text-sm leading-relaxed whitespace-pre-line">{description}</p>}
      {images.length > 0 && (
        <div className="mx-auto max-w-2xl space-y-2">
          {images.map((src, i) => (
            <ProductImage
              key={src}
              src={src}
              alt={`${alt} 상세 사진 ${i + 1}`}
              className="h-auto"
            />
          ))}
        </div>
      )}
    </section>
  )
}
