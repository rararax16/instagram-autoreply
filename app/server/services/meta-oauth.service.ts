type MetaTokenResponse = {
  access_token: string
  token_type?: string
  expires_in?: number
  user_id?: string | number
}

type InstagramProfileResponse = {
  user_id?: string | number
  id?: string | number
  username?: string
}

export type InstagramOAuthAccount = {
  accessToken: string
  instagramUserId: string
  instagramUsername: string
}

function normalizeApiVersion(apiVersion: string): string {
  if (!apiVersion) {
    return 'v24.0'
  }

  return apiVersion.startsWith('v') ? apiVersion : `v${apiVersion}`
}

function getMetaConfig() {
  const config = useRuntimeConfig()

  return {
    appBaseUrl: (config.appBaseUrl || process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
    appId: config.metaAppId || process.env.META_APP_ID || '',
    appSecret: config.metaAppSecret || process.env.META_APP_SECRET || '',
    apiVersion: normalizeApiVersion(config.metaApiVersion || process.env.META_API_VERSION || 'v24.0'),
    oauthScopes: (config.metaOauthScopes || process.env.META_OAUTH_SCOPES ||
      'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments')
      .split(',')
      .map((scope: string) => scope.trim())
      .filter(Boolean)
  }
}

function getGraphInstagramBaseUrl(apiVersion: string, withVersion: boolean): string {
  if (withVersion) {
    return `https://graph.instagram.com/${apiVersion}`
  }

  return 'https://graph.instagram.com'
}

function parseId(value: string | number | undefined): string {
  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'string') {
    return value
  }

  return ''
}

async function fetchInstagramProfile(accessToken: string): Promise<InstagramProfileResponse> {
  const { apiVersion } = getMetaConfig()

  const endpoints = [
    `${getGraphInstagramBaseUrl(apiVersion, true)}/me`,
    `${getGraphInstagramBaseUrl(apiVersion, false)}/me`
  ]

  const fieldsOptions = ['user_id,username', 'id,username']
  let lastError: any = null
  let fallbackProfile: InstagramProfileResponse | null = null

  for (const endpoint of endpoints) {
    for (const fields of fieldsOptions) {
      try {
        const profile = await $fetch<InstagramProfileResponse>(endpoint, {
          query: {
            fields,
            access_token: accessToken
          }
        })

        const parsedId = parseId(profile.user_id) || parseId(profile.id)
        if (parsedId) {
          return profile
        }

        if (!fallbackProfile) {
          fallbackProfile = profile
        }
      }
      catch (error: any) {
        lastError = error
      }
    }
  }

  if (fallbackProfile) {
    return fallbackProfile
  }

  if (lastError) {
    throw lastError
  }

  throw createError({
    statusCode: 400,
    message: 'Instagramプロフィール情報の取得に失敗しました'
  })
}

export function getInstagramOAuthCallbackUrl(): string {
  const { appBaseUrl } = getMetaConfig()
  return `${appBaseUrl}/api/ig-accounts/oauth/callback`
}

export function buildInstagramOAuthUrl(state: string): string {
  const { appId, oauthScopes } = getMetaConfig()

  if (!appId) {
    throw createError({
      statusCode: 500,
      message: 'META_APP_ID（InstagramアプリID）が設定されていません'
    })
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getInstagramOAuthCallbackUrl(),
    response_type: 'code',
    scope: oauthScopes.join(','),
    state
  })

  params.set('enable_fb_login', '0')
  params.set('force_authentication', '1')
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`
}

async function exchangeForLongLivedToken(accessToken: string): Promise<MetaTokenResponse | null> {
  const { appSecret } = getMetaConfig()

  try {
    return await $fetch<MetaTokenResponse>('https://graph.instagram.com/access_token', {
      query: {
        grant_type: 'ig_exchange_token',
        client_secret: appSecret,
        access_token: accessToken
      }
    })
  }
  catch {
    return null
  }
}

export async function exchangeCodeForUserToken(code: string): Promise<MetaTokenResponse> {
  const { appId, appSecret } = getMetaConfig()

  if (!appId || !appSecret) {
    throw createError({
      statusCode: 500,
      message: 'META_APP_ID または META_APP_SECRET（Instagramアプリ設定）が不足しています'
    })
  }

  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: getInstagramOAuthCallbackUrl(),
    code
  })

  try {
    const shortLivedToken = await $fetch<MetaTokenResponse>('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    })

    const longLivedToken = await exchangeForLongLivedToken(shortLivedToken.access_token)

    if (!longLivedToken?.access_token) {
      return shortLivedToken
    }

    return {
      ...shortLivedToken,
      ...longLivedToken,
      user_id: shortLivedToken.user_id ?? longLivedToken.user_id
    }
  }
  catch (error: any) {
    const graphMessage = error?.data?.error_message || error?.data?.error?.message
    throw createError({
      statusCode: 400,
      message: graphMessage || 'Instagram連携トークンの取得に失敗しました'
    })
  }
}

export async function fetchInstagramOAuthAccounts(
  userAccessToken: string,
  fallbackUserId?: string
): Promise<InstagramOAuthAccount[]> {
  try {
    const profile = await fetchInstagramProfile(userAccessToken)
    const instagramUserId = parseId(profile.user_id) || parseId(profile.id) || (fallbackUserId || '')

    if (!instagramUserId) {
      throw createError({
        statusCode: 400,
        message: 'InstagramユーザーIDを取得できませんでした'
      })
    }

    return [
      {
        accessToken: userAccessToken,
        instagramUserId,
        instagramUsername: profile.username || `ig_${instagramUserId}`
      }
    ]
  }
  catch (error: any) {
    const graphMessage = error?.data?.error_message || error?.data?.error?.message || error?.message
    throw createError({
      statusCode: 400,
      message: graphMessage || 'Instagram連携アカウントの取得に失敗しました'
    })
  }
}
