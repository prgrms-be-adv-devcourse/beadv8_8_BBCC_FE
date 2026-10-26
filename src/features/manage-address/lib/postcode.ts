/** 카카오(다음) 우편번호 서비스. 패키지 없이 공식 스크립트를 처음 쓸 때 한 번 불러온다 */
const SCRIPT_URL = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

export type PostcodeResult = { zipCode: string; roadAddress: string }

type PostcodeData = { zonecode: string; roadAddress: string; address: string }
type PostcodeOptions = {
  oncomplete: (data: PostcodeData) => void
  width: string
  height: string
}
type DaumPostcode = new (options: PostcodeOptions) => {
  embed: (element: HTMLElement, options?: { autoClose?: boolean }) => void
}

const postcodeClass = () =>
  (window as unknown as { daum?: { Postcode?: DaumPostcode } }).daum?.Postcode

let loading: Promise<DaumPostcode> | null = null

function loadPostcode() {
  const loaded = postcodeClass()
  if (loaded) return Promise.resolve(loaded)
  loading ??= new Promise<DaumPostcode>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.onload = () => {
      const Postcode = postcodeClass()
      if (Postcode) resolve(Postcode)
      else reject(new Error('우편번호 서비스를 불러오지 못했어요.'))
    }
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('우편번호 서비스를 불러오지 못했어요.'))
    }
    document.head.append(script)
  })
  return loading
}

/** element 안에 주소 검색 화면을 그린다. 주소를 고르면 onSelect */
export async function embedPostcodeSearch(
  element: HTMLElement,
  onSelect: (result: PostcodeResult) => void,
) {
  const Postcode = await loadPostcode()
  new Postcode({
    // 지번 주소를 고르면 도로명이 비어 있을 수 있다
    oncomplete: (data) =>
      onSelect({ zipCode: data.zonecode, roadAddress: data.roadAddress || data.address }),
    width: '100%',
    height: '100%',
  }).embed(element, { autoClose: false })
}
