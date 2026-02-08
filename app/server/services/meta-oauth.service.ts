type MetaTokenResponse = {
  access_token: string
  token_type?: string
  expires_in?: number
}

type MeAccountsResponse = {
  data?: Array<{
    id: string
    name?: string
    access_token?: string
    instagram_business_account?: {
      id: string
      username?: string
    }
  }>
}

type InstagramProfileResponse = {
  username?: string
}

export type InstagramOAuthAccount = {
  pageId: string
  pageName: string
  accessToken: string
  instagramUserId: string
  instagramUsername: string
}

function getMetaConfig() {
  const config = useRuntimeConfig()

  return {
    appBaseUrl: (config.appBaseUrl || process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
    appId: config.metaAppId || process.env.META_APP_ID || '',
    appSecret: config.metaAppSecret || process.env.META_APP_SECRET || '',
    apiVersion: config.metaApiVersion || process.env.META_API_VERSION || 'v24.0',
    oauthScopes: (config.metaOauthScopes || process.env.META_OAUTH_SCOPES ||
      'instagram_basic,instagram_manage_messages,instagram_manage_comments,pages_show_list,pages_read_engagement,pages_manage_metadata,business_management')
      .split(',')
      .map(scope => scope.trim())
      .filter(Boolean)
  }
}

function getGraphBaseUrl(apiVersion: string): string {
  return `https://graph.facebook.com/${apiVersion}`
}

async function fetchInstagramUsername(apiVersion: string, igUserId: string, accessToken: string): Promise<string> {
  try {
    const profile = await $fetch<InstagramProfileResponse>(`${getGraphBaseUrl(apiVersion)}/${igUserId}`, {
      query: {
        fields: 'username',
        access_token: accessToken
      }
    })

    return profile.username || ''
  }
  catch {
    return ''
  }
}

export function getInstagramOAuthCallbackUrl(): string {
  const { appBaseUrl } = getMetaConfig()
  return `${appBaseUrl}/api/ig-accounts/oauth/callback`
}

export function buildInstagramOAuthUrl(state: string): string {
  const { appId, apiVersion, oauthScopes } = getMetaConfig()

  if (!appId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'META_APP_ID が設定されていません'
    })
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getInstagramOAuthCallbackUrl(),
    response_type: 'code',
    scope: oauthScopes.join(','),
    state
  })

  return `https://www.facebook.com/${apiVersion}/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForUserToken(code: string): Promise<MetaTokenResponse> {
  const { appId, appSecret, apiVersion } = getMetaConfig()

  if (!appId || !appSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'META_APP_ID または META_APP_SECRET が設定されていません'
    })
  }

  try {
    return await $fetch<MetaTokenResponse>(`${getGraphBaseUrl(apiVersion)}/oauth/access_token`, {
      query: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: getInstagramOAuthCallbackUrl(),
        code
      }
    })
  }
  catch (error: any) {
    const graphMessage = error?.data?.error?.message
    throw createError({
      statusCode: 400,
      statusMessage: graphMessage || 'Instagram連携トークンの取得に失敗しました'
    })
  }
}

export async function fetchInstagramOAuthAccounts(userAccessToken: string): Promise<InstagramOAuthAccount[]> {
  const { apiVersion } = getMetaConfig()

  try {
    const response = await $fetch<MeAccountsResponse>(`${getGraphBaseUrl(apiVersion)}/me/accounts`, {
      query: {
        fields: 'id,name,access_token,instagram_business_account{id,username}',
        access_token: userAccessToken,
        limit: 100
      }
    })

    if (!response.data?.length) {
      return []
    }

    const results: InstagramOAuthAccount[] = []

    for (const page of response.data) {
      const igAccount = page.instagram_business_account

      if (!igAccount?.id) {
        continue
      }

      const accessToken = page.access_token || userAccessToken
      const username = igAccount.username || await fetchInstagramUsername(apiVersion, igAccount.id, accessToken)

      results.push({
        pageId: page.id,
        pageName: page.name || '',
        accessToken,
        instagramUserId: igAccount.id,
        instagramUsername: username || `ig_${igAccount.id}`
      })
    }

    return results
  }
  catch (error: any) {
    const graphMessage = error?.data?.error?.message
    throw createError({
      statusCode: 400,
      statusMessage: graphMessage || 'Instagram連携アカウントの取得に失敗しました'
    })
  }
}
