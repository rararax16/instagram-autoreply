import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

type UpdateBody = {
  enabled?: boolean
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateBody>(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'アカウントIDが不正です' })
  }

  if (typeof body.enabled !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'enabled は真偽値で指定してください' })
  }

  const account = await prisma.igAccount.findFirst({
    where: {
      id,
      tenantId: user.tenantId
    },
    select: {
      id: true
    }
  })

  if (!account) {
    throw createError({ statusCode: 404, statusMessage: 'Instagram連携アカウントが見つかりません' })
  }

  const updated = await prisma.igAccount.update({
    where: { id: account.id },
    data: {
      enabled: body.enabled
    },
    select: {
      id: true,
      platformUserId: true,
      username: true,
      enabled: true,
      updatedAt: true
    }
  })

  return {
    message: 'Instagram連携アカウントを更新しました',
    account: updated
  }
})
