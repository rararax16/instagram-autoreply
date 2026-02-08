import { createHmac } from 'node:crypto'
import type { H3Event } from 'h3'

export const SESSION_COOKIE_NAME = 'insta_session'

export type SessionPayload = {
  userId: string
  tenantId: string
  email: string
  exp: number
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

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

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodePayload(value: string): SessionPayload | null {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf-8')
    const parsed = JSON.parse(decoded) as SessionPayload

    if (!parsed.userId || !parsed.tenantId || !parsed.email || !parsed.exp) {
      return null
    }

    return parsed
  }
  catch {
    return null
  }
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const secret = getSessionSecret()
  const sessionPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000
  }
  const encoded = encodePayload(sessionPayload)
  const signature = signPayload(encoded, secret)
  return `${encoded}.${signature}`
}

export function setSessionCookie(event: H3Event, payload: Omit<SessionPayload, 'exp'>) {
  const token = createSessionToken(payload)

  setCookie(event, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/'
  })
}

export function getSessionFromEvent(event: H3Event): SessionPayload | null {
  const token = getCookie(event, SESSION_COOKIE_NAME)

  if (!token) {
    return null
  }

  const [encoded, signature] = token.split('.')

  if (!encoded || !signature) {
    return null
  }

  const secret = getSessionSecret()
  const expected = signPayload(encoded, secret)

  if (expected !== signature) {
    return null
  }

  const payload = decodePayload(encoded)

  if (!payload || payload.exp < Date.now()) {
    return null
  }

  return payload
}
