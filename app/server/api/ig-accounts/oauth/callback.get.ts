import { sendRedirect } from 'h3'
import { encryptText } from '../../../utils/crypto'
import { prisma } from '../../../utils/prisma'
import { verifyInstagramOAuthState } from '../../../utils/oauth-state'
import { exchangeCodeForUserToken, fetchInstagramOAuthAccounts } from '../../../services/meta-oauth.service'

function getSingleQueryParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0] || ''
  }

  return ''
}

function redirectWithError(event: Parameters<typeof sendRedirect>[0], message: string) {
  return sendRedirect(event, `/dashboard?ig_error=${encodeURIComponent(message)}`)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const oauthError = getSingleQueryParam(query.error as string | string[] | undefined)

  if (oauthError) {
    const description = getSingleQueryParam(query.error_description as string | string[] | undefined)
    return redirectWithError(event, description || 'Instagram連携がキャンセルされました')
  }

  const code = getSingleQueryParam(query.code as string | string[] | undefined)
  const state = getSingleQueryParam(query.state as string | string[] | undefined)

  if (!code || !state) {
    return redirectWithError(event, 'Instagram連携に必要な情報が不足しています')
  }

  const statePayload = verifyInstagramOAuthState(state)

  if (!statePayload) {
    return redirectWithError(event, 'Instagram連携の検証に失敗しました。再度お試しください')
  }

  const user = await prisma.user.findUnique({
    where: {
      id: statePayload.userId
    },
    select: {
      id: true,
      tenantId: true
    }
  })

  if (!user || user.tenantId !== statePayload.tenantId) {
    return redirectWithError(event, 'ユーザー情報の確認に失敗しました')
  }

  try {
    const token = await exchangeCodeForUserToken(code)
    const accounts = await fetchInstagramOAuthAccounts(token.access_token)

    if (accounts.length === 0) {
      return redirectWithError(event, 'Instagramビジネスアカウントが見つかりませんでした')
    }

    await prisma.$transaction(async (tx) => {
      for (const account of accounts) {
        await tx.igAccount.upsert({
          where: {
            tenantId_platformUserId: {
              tenantId: user.tenantId,
              platformUserId: account.instagramUserId
            }
          },
          update: {
            username: account.instagramUsername,
            accessTokenEncrypted: encryptText(account.accessToken),
            enabled: true
          },
          create: {
            tenantId: user.tenantId,
            platformUserId: account.instagramUserId,
            username: account.instagramUsername,
            accessTokenEncrypted: encryptText(account.accessToken),
            enabled: true
          }
        })
      }
    })

    return sendRedirect(event, `/dashboard?ig_connected=${accounts.length}`)
  }
  catch (error: any) {
    const message = error?.statusMessage || 'Instagram連携処理に失敗しました'
    return redirectWithError(event, message)
  }
})
