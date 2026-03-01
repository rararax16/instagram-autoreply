import type { H3Event } from 'h3'
import { prisma } from './prisma'
import { getSessionFromEvent } from './session'

type UserRole = 'ADMIN' | 'MEMBER'

export type AuthUser = {
  id: string
  tenantId: string
  email: string
  role: UserRole
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
      email: true,
      role: true
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

export async function requireAdmin(event: H3Event): Promise<AuthUser> {
  const user = await requireAuth(event)

  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: '管理者権限が必要です'
    })
  }

  return user
}
