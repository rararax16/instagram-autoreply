import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'アカウントIDが不正です' })
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

  await prisma.igAccount.delete({
    where: {
      id: account.id
    }
  })

  return {
    message: 'Instagram連携を解除しました'
  }
})
