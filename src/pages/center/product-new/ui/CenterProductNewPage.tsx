import { Link } from 'react-router'
import { RegisterProductForm } from '@/features/register-product'
import { ProductImageUploader } from '@/features/upload-product-image'
import { paths, sellerPathsOf } from '@/shared/config'
import { useArea } from '@/shared/lib'
import { PageHeader } from '@/shared/ui/PageHeader'

/** 상품 등록 (목록과 따로): 카테고리 · 기본 정보 · 사진 · 옵션 · 판매가 · 실측 묶음을 읽기 쉬운 폭으로 */
export function CenterProductNewPage() {
  const area = useArea()
  const sellerPaths = sellerPathsOf(area)
  // 판매를 시작한 뒤 이어서 볼 구매자 상품 상세 (콘솔이면 콘솔 상품 상세)
  const productHref = area === 'console' ? paths.console.product : paths.shop.product

  return (
    <div className="shop-look max-w-2xl space-y-6">
      <Link
        to={sellerPaths.products}
        className="text-ink-3 hover:text-ink active:text-ink-2 inline-flex min-h-11 items-center gap-1 rounded-md text-[13px] font-semibold transition-colors lg:min-h-0"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        상품 관리
      </Link>
      <PageHeader
        title="상품 등록"
        step="②"
        description="카테고리를 고르면 그 카테고리의 입력 항목으로 폼을 만들어요. 등록하면 바로 판매를 시작해요."
        note="등록 · 판매 시작은 모두 실제 API예요. 「등록하고 판매 시작」은 등록 POST 뒤 sale-status PUT을 이어 보내고, 판매 시작만 실패하면 상품은 판매 대기(SALE_PENDING)로 남아요. 판매를 시작하면 상품이 product.changed 이벤트를 보내 추천 · 주문이 복사본을 저장해요. 사진은 브라우저에서 긴 변 2000px JPG로 줄인 뒤, 업로드 주소를 발급받아 S3에 바로 올리고 그 주소를 등록 요청에 담아요."
      />
      <RegisterProductForm
        productHref={(id) => productHref(id)}
        renderImages={(field) => <ProductImageUploader {...field} />}
      />
    </div>
  )
}
