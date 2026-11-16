import { expect, test, type Route } from '@playwright/test'
import { signInAdmin } from './support/admin'
import { acceptConfirms } from './support/confirm'

// 챗봇 API(BE #1191)는 가짜 백엔드에 없어 이 테스트에서만 응답을 정한다

/** 브라우저가 읽을 수 있게 Gateway CORS와 같은 헤더를 붙인다 (Retry-After를 내보낸다) */
const CORS = {
  'access-control-allow-origin': 'http://localhost:5174',
  'access-control-allow-credentials': 'true',
  'access-control-expose-headers': 'Retry-After',
}

const ANSWER = {
  answer: '3만원 이하 여아 원피스를 찾았어요.',
  sources: [{ documentId: 3, title: '사이즈 안내' }],
  products: [
    {
      productId: 101,
      name: '꽃무늬 원피스',
      businessName: '키들리 상점',
      price: 29000,
      thumbnailUrl: null,
      soldOut: false,
    },
    {
      productId: 102,
      name: '리본 원피스',
      businessName: null,
      price: 25000,
      thumbnailUrl: null,
      soldOut: true,
    },
  ],
}

test('쇼핑 챗봇: 로그인 안내 → 질문 · 답 · 상품 카드 · 근거 → history와 함께 다시 묻기 → 429 안내', async ({
  page,
}) => {
  const sent: unknown[] = []
  let calls = 0
  await page.route('**/api/v1/chatbot/messages', (route: Route) => {
    sent.push(route.request().postDataJSON())
    calls += 1
    if (calls === 1) return route.fulfill({ json: ANSWER, headers: CORS })
    return route.fulfill({
      status: 429,
      headers: { ...CORS, 'retry-after': '42' },
      contentType: 'application/problem+json',
      json: {
        type: 'about:blank',
        title: '요청이 너무 많습니다',
        status: 429,
        detail: '잠시 후 다시 시도해 주세요.',
        instance: '/api/v1/chatbot/messages',
      },
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: '챗봇에게 묻기' }).click()
  const chat = page.getByRole('region', { name: '챗봇 상담' })
  await expect(chat.getByRole('link', { name: '로그인하기' })).toBeVisible()

  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.getByRole('button', { name: '챗봇에게 묻기' }).click()

  const input = chat.getByRole('textbox', { name: '챗봇에게 물어볼 내용' })
  await chat.getByRole('button', { name: '3만원 이하 여아 원피스 추천해 줘' }).click()
  await expect(input).toHaveValue('3만원 이하 여아 원피스 추천해 줘')
  await chat.getByRole('button', { name: '보내기' }).click()

  await expect(chat.getByText('3만원 이하 여아 원피스를 찾았어요.')).toBeVisible()
  const products = chat.getByRole('list', { name: '찾은 상품' })
  await expect(products.getByRole('link')).toHaveCount(2)
  await expect(products.getByRole('link', { name: /리본 원피스/ })).toContainText('품절')
  await expect(chat.getByText('참고한 안내: 사이즈 안내')).toBeVisible()
  expect(sent[0]).toEqual({ message: '3만원 이하 여아 원피스 추천해 줘', history: [] })

  await input.fill('더 싼 것도 있어?')
  await input.press('Enter')
  await expect(chat.getByRole('alert')).toHaveText(
    '질문이 많아 잠시 쉬어 가요. 42초 뒤에 다시 물어봐 주세요.',
  )
  // 실패한 질문은 입력 칸으로 돌아오고, 앞 대화는 history로 갔다
  await expect(input).toHaveValue('더 싼 것도 있어?')
  expect(sent[1]).toEqual({
    message: '더 싼 것도 있어?',
    history: [
      { role: 'USER', content: '3만원 이하 여아 원피스 추천해 줘' },
      { role: 'ASSISTANT', content: '3만원 이하 여아 원피스를 찾았어요.' },
    ],
  })

  await products.getByRole('link', { name: /꽃무늬 원피스/ }).click()
  await expect(page).toHaveURL('/products/101')
})

test('관리자 챗봇 문서: 목록 → 등록 → 상세(조각 수) → 삭제', async ({ page }) => {
  type Document = {
    id: number
    title: string
    category: string
    content: string
    chunkCount: number
    createdAt: string
    updatedAt: string
  }
  let documents: Document[] = []
  const created: unknown[] = []
  await page.route('**/api/v1/admin/chatbot/documents**', (route: Route) => {
    const request = route.request()
    const { pathname } = new URL(request.url())
    const id = Number(pathname.split('/').pop())
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as Pick<Document, 'title' | 'category' | 'content'>
      created.push(body)
      const document = {
        ...body,
        id: 7,
        chunkCount: 1,
        createdAt: '2026-11-12T10:00:00',
        updatedAt: '2026-11-12T10:00:00',
      }
      documents = [document]
      return route.fulfill({ status: 201, json: document, headers: CORS })
    }
    if (request.method() === 'DELETE') {
      documents = documents.filter((document) => document.id !== id)
      return route.fulfill({ status: 204, headers: CORS })
    }
    if (Number.isInteger(id) && id > 0) {
      const document = documents.find((item) => item.id === id)
      return route.fulfill({ json: document, headers: CORS })
    }
    const content = documents.map(({ id, title, category, createdAt, updatedAt }) => ({
      id,
      title,
      category,
      createdAt,
      updatedAt,
    }))
    return route.fulfill({
      json: {
        content,
        page: 0,
        size: 20,
        totalElements: content.length,
        totalPages: 1,
        hasNext: false,
      },
      headers: CORS,
    })
  })

  await acceptConfirms(page)
  await signInAdmin(page)
  await page
    .getByRole('navigation', { name: '관리자 메뉴' })
    .getByRole('link', { name: '답변 문서' })
    .click()
  await expect(page.getByRole('heading', { name: '챗봇 답변 문서', level: 1 })).toBeVisible()
  await expect(page.getByText('등록한 문서가 없어요.', { exact: false })).toBeVisible()

  await page.getByRole('link', { name: '문서 등록' }).click()
  await page.getByRole('button', { name: '문서 저장' }).click()
  await expect(page.getByText('제목을 입력해 주세요.')).toBeVisible()
  await page.getByLabel('제목').fill('교환 · 반품 정책')
  await page.getByLabel('분류').selectOption('POLICY')
  await page.getByLabel('본문').fill('받은 날부터 7일 안에 교환할 수 있어요.')
  await page.getByRole('button', { name: '문서 저장' }).click()

  await expect(page).toHaveURL('/admin/chatbot/documents/7')
  await expect(page.getByRole('heading', { name: '교환 · 반품 정책', level: 1 })).toBeVisible()
  await expect(page.locator('dd', { hasText: '1개' })).toBeVisible()
  expect(created).toEqual([
    {
      title: '교환 · 반품 정책',
      category: 'POLICY',
      content: '받은 날부터 7일 안에 교환할 수 있어요.',
    },
  ])

  await page.getByRole('button', { name: '문서 삭제' }).click()
  await expect(page).toHaveURL('/admin/chatbot/documents')
  await expect(page.getByText('등록한 문서가 없어요.', { exact: false })).toBeVisible()
})
