import { issueDemoToken } from '@/entities/session'
import { productApi, toCategories } from '@/entities/product'
import { walletApi } from '@/entities/wallet'
import { DEMO_PRICE } from '@/features/register-product'
import { DEMO_ACCOUNTS } from '@/features/switch-demo-role'
import { getErrorMessage, runWithAction } from '@/shared/api'
import { runPreflight } from '../model/preflight'

/** 실제 API로 시작 전 점검 (흐름 패널에 "시작 전 점검 · …"으로 남는다) */
export const checkBeforeDemo = () =>
  runPreflight({
    categories: () =>
      runWithAction('시작 전 점검 · 카테고리', async () =>
        toCategories(await productApi.categories()),
      ),
    accounts: DEMO_ACCOUNTS.map((account) => ({
      label: account.label,
      issueToken: () =>
        runWithAction(`시작 전 점검 · ${account.label} 토큰`, () => issueDemoToken(account)),
    })),
    walletBalance: (token) =>
      runWithAction(
        '시작 전 점검 · 보호자 예치금',
        async () => (await walletApi.getMine(token)).balance,
      ),
    guardian: '보호자',
    price: DEMO_PRICE,
    errorMessage: getErrorMessage,
  })
