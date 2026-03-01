import { sendRedirect } from 'h3'
import { buildInstagramOAuthUrl } from '../../../services/meta-oauth.service'
import { requireAuth } from '../../../utils/auth'
import { createInstagramOAuthState } from '../../../utils/oauth-state'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const state = createInstagramOAuthState(user.id, user.tenantId)
    const oauthUrl = buildInstagramOAuthUrl(state)

    return sendRedirect(event, oauthUrl)
  }
  catch (error: any) {
    const message = error?.statusMessage || error?.message || 'Instagram連携の設定に失敗しました'
    return sendRedirect(event, `/dashboard?ig_error=${encodeURIComponent(message)}`)
  }
})
