import type { Page } from '@playwright/test'

/** 화면 안 확인 모달(confirmAction)이 뜨면 확인을 누른다 (예전 page.on('dialog') 대신) */
export async function acceptConfirms(page: Page) {
  await page.addLocatorHandler(page.getByRole('alertdialog'), async (dialog) => {
    await dialog.locator('[data-confirm]').click()
  })
}
