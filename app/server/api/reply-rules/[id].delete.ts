import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ルールIDが不正です' })
  }

  const existing = await prisma.replyRule.findFirst({
    where: {
      id,
      tenantId: user.tenantId
    }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: '返信ルールが見つかりません' })
  }

  await prisma.replyRule.delete({
    where: { id: existing.id }
  })

  return {
    message: '返信ルールを削除しました'
  }
})
