export default defineEventHandler((event) => {
  const query = getQuery(event)
  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']
  const config = useRuntimeConfig()

  console.log('🐶🐶🐶Instagram Webhook Verification Request:', { mode, token, challenge })
  console.log('🐶🐶🐶Expected Verify Token:', config.metaWebhookVerifyToken)

  if (mode === 'subscribe' && token === config.metaWebhookVerifyToken) {
    return challenge || 'ok'
  }

  throw createError({
    statusCode: 403,
    message: 'Webhook検証に失敗しました???'
  })
})
