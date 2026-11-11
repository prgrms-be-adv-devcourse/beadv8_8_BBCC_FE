/**
 * 상품 사진이 없을 때 쓰는 샘플 사진 (Unsplash, Unsplash License · 무료).
 * 시연 데이터를 켰을 때만 쓴다. 꺼져 있으면 기본 그림을 보여 준다 (실제 상품을 다른 사진으로 꾸미지 않게)
 */
const UNSPLASH = 'https://images.unsplash.com'

const SAMPLE_PHOTO_IDS = [
  'photo-1635327343808-37edbaf09d70', // 노란 맨투맨
  'photo-1565843248736-8c41e6db117b', // 분홍 맨투맨
  'photo-1675833366391-582bb70c347c', // 파란 패딩
  'photo-1614016365964-033b0e71182f', // 니트 모자 · 갈색 재킷
  'photo-1613292852358-970e49578143', // 줄무늬 재킷
  'photo-1620905385976-9f191e837efd', // 빨간 티셔츠
  'photo-1604482858862-1db908a653e4', // 티셔츠 · 반바지
  'photo-1604303768345-038b79a8c47a', // 체크 셔츠
  'photo-1695263747144-a52aa3739d62', // 파란 재킷
  'photo-1628215529991-72aa205333f5', // 검정 패딩
] as const

/** 홈 첫 칸 사진 (눈밭의 아이) */
export const HOME_HERO_PHOTO = `${UNSPLASH}/photo-1606946185142-7b30e9a7abcc?w=1600&q=80&auto=format&fit=crop`

/** 같은 상품은 늘 같은 사진이 나오게 이름(또는 ID)으로 고른다 */
export function samplePhotoOf(key: string, width = 600): string {
  // FNV-1a: 끝 글자만 다른 이름(「상품 A」 · 「상품 B」)도 다른 사진이 나오게 고르게 섞는다
  let hash = 0x811c9dc5
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0
  const id = SAMPLE_PHOTO_IDS[hash % SAMPLE_PHOTO_IDS.length]
  return `${UNSPLASH}/${id}?w=${width}&q=80&auto=format&fit=crop`
}
