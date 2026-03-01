import { requireAdmin } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const adminUser = await requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ユーザーIDが不正です'
    })
  }

  if (id === adminUser.id) {
    throw createError({
      statusCode: 400,
      message: 'ログイン中のユーザーは削除できません'
    })
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id
    },
    select: {
      id: true,
      role: true
    }
  })

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      message: '対象ユーザーが見つかりません'
    })
  }

  if (targetUser.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    })

    if (adminCount <= 1) {
      throw createError({
        statusCode: 400,
        message: '管理者ユーザーが0件になるため削除できません'
      })
    }
  }

  await prisma.user.delete({
    where: {
      id: targetUser.id
    }
  })

  return {
    message: 'ユーザーを削除しました'
  }
})
