// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/icon.png' },
        { rel: 'shortcut icon', href: '/icon.png' },
        { rel: 'apple-touch-icon', href: '/icon.png' }
      ]
    }
  },
  runtimeConfig: {
    appBaseUrl: process.env.APP_BASE_URL,
    sessionSecret: process.env.SESSION_SECRET,
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY,
    metaAppId: process.env.META_APP_ID,
    metaAppSecret: process.env.META_APP_SECRET,
    metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
    metaApiVersion: process.env.META_API_VERSION || 'v24.0',
    metaOauthScopes: process.env.META_OAUTH_SCOPES ||
      'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments'
  }
})
