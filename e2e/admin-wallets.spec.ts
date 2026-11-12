import { expect, test, type APIRequestContext } from '@playwright/test'
import { signInAdmin } from './support/admin'
import { acceptConfirms } from './support/confirm'

const FAKE = 'http://localhost:18080/api/v1/__fake'

// 관리자 지갑 (BE #670 · #731): 메뉴 → 동결 지갑 거르기 → 잔액 돌려주기 · 그사이 잔액이 바뀌면 다시 불러와 다시 누르기.
// 돌려주면 잔액이 0이 되어 다음 실행에 다시 쓸 수 없으므로, 가짜 백엔드에 실행마다 새 동결 지갑을 만든다
async function newFrozenWallet(request: APIRequestContext, balance: number) {
  const response = await request.post(`${FAKE}/frozen-wallets`, { data: { balance } })
  return ((await response.json()) as { walletId: number }).walletId
}

test('관리자 지갑: 동결 지갑 거르기 → 잔액 돌려주기, 잔액이 바뀌었으면 다시 불러와 다시 누르기', async ({
  page,
  request,
}) => {
  const walletId = await newFrozenWallet(request, 25000)
  const changedId = await newFrozenWallet(request, 30000)
  await acceptConfirms(page)
  await signInAdmin(page)

  const table = page.getByRole('table', { name: '지갑' })
  const row = (id: number) => table.getByRole('row', { name: `지갑 ${id}`, exact: true })

  await test.step('메뉴 → 지갑 → 동결된 지갑만', async () => {
    await page
      .getByRole('navigation', { name: '관리자 메뉴' })
      .getByRole('link', { name: '지갑' })
      .click()
    await expect(page.getByRole('heading', { name: '지갑', level: 1 })).toBeVisible()
    // 거르지 않으면 사용 중인 지갑도 보이고, 사용 중인 지갑에는 돌려주기 버튼이 없다
    const active = table.getByRole('row').filter({ hasText: '사용 중' }).first()
    await expect(active).toBeVisible()
    await expect(active.getByRole('button', { name: '잔액 돌려주기' })).toHaveCount(0)

    const frozenOnly = page.getByRole('button', { name: '동결된 지갑만' })
    await frozenOnly.click()
    await expect(frozenOnly).toHaveAttribute('aria-pressed', 'true')
    await expect(table.getByText('사용 중')).toHaveCount(0)
    await expect(row(walletId)).toContainText('25,000원')
    await expect(row(walletId)).toContainText('동결')
  })

  await test.step('잔액 돌려주기 → 잔액 0원, 버튼이 사라진다', async () => {
    await row(walletId).getByRole('button', { name: '잔액 돌려주기' }).click()
    await expect(row(walletId).getByRole('status')).toHaveText('25,000원을 돌려줬다고 기록했어요')
    await expect(row(walletId).getByRole('cell', { name: '0원', exact: true })).toBeVisible()
    await expect(row(walletId).getByRole('button', { name: '잔액 돌려주기' })).toHaveCount(0)
  })

  await test.step('잔액 있는 지갑만: 돌려준 지갑은 빠진다', async () => {
    await page.getByRole('button', { name: '잔액 있는 지갑만' }).click()
    await expect(row(changedId)).toBeVisible()
    await expect(row(walletId)).toHaveCount(0)
  })

  await test.step('그사이 잔액이 바뀌면 알려 주고 목록을 다시 불러온다 → 다시 누르면 된다', async () => {
    await expect(row(changedId)).toContainText('30,000원')
    await request.post(`${FAKE}/wallet-balances`, { data: { walletId: changedId, balance: 31000 } })
    await row(changedId).getByRole('button', { name: '잔액 돌려주기' }).click()
    await expect(row(changedId).getByRole('alert')).toHaveText(
      '지갑 목록을 다시 불러와 지금 잔액으로 다시 요청해 주세요.',
    )
    await expect(row(changedId)).toContainText('31,000원')

    await row(changedId).getByRole('button', { name: '잔액 돌려주기' }).click()
    // 잔액이 0이 되어 「잔액 있는 지갑만」 목록에서 빠진다
    await expect(row(changedId)).toHaveCount(0)
  })
})
