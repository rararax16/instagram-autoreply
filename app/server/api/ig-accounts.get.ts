import { requireAuth } from '../utils/auth'
import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const accounts = await prisma.igAccount.findMany({
    where: {
      tenantId: user.tenantId
    },
    orderBy: {
      updatedAt: 'desc'
    },
    select: {
      id: true,
      platformUserId: true,
      username: true,
      enabled: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return {
    message: 'Instagram連携情報を取得しました',
    accounts
  }
})
