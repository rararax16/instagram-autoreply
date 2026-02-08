import { createHmac, randomUUID } from 'node:crypto'

type OAuthStatePayload = {
  userId: string
  tenantId: string
  nonce: string
  exp: number
}

const OAUTH_STATE_TTL_SECONDS = 60 * 10

function getSessionSecret(): string {
  const config = useRuntimeConfig()
  const secret = config.sessionSecret || process.env.SESSION_SECRET || ''

  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SESSION_SECRET が設定されていません'
    })
  }

  return secret
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function encodePayload(payload: OAuthStatePayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodePayload(encoded: string): OAuthStatePayload | null {
  try {
    const decoded = Buffer.from(encoded, 'base64url').toString('utf-8')
    const payload = JSON.parse(decoded) as OAuthStatePayload

    if (!payload.userId || !payload.tenantId || !payload.nonce || !payload.exp) {
      return null
    }

    return payload
  }
  catch {
    return null
  }
}

export function createInstagramOAuthState(userId: string, tenantId: string): string {
  const payload: OAuthStatePayload = {
    userId,
    tenantId,
    nonce: randomUUID(),
    exp: Date.now() + OAUTH_STATE_TTL_SECONDS * 1000
  }

  const encoded = encodePayload(payload)
  const signature = sign(encoded, getSessionSecret())
  return `${encoded}.${signature}`
}

export function verifyInstagramOAuthState(state: string): OAuthStatePayload | null {
  const [encoded, signature] = state.split('.')

  if (!encoded || !signature) {
    return null
  }

  const expectedSignature = sign(encoded, getSessionSecret())

  if (signature !== expectedSignature) {
    return null
  }

  const payload = decodePayload(encoded)

  if (!payload || payload.exp < Date.now()) {
    return null
  }

  return payload
}
