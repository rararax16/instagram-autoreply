import type { H3Event } from 'h3'
import { prisma } from './prisma'
import { getSessionFromEvent } from './session'

export type AuthUser = {
  id: string
  tenantId: string
  email: string
}

export async function getAuthUser(event: H3Event): Promise<AuthUser | null> {
  const session = getSessionFromEvent(event)

  if (!session) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      tenantId: true,
      email: true
    }
  })

  if (!user || user.tenantId !== session.tenantId) {
    return null
  }

  return user
}

export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const user = await getAuthUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'ログインが必要です'
    })
  }

  return user
}
