import { requireAuth } from '../utils/auth'
import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const events = await prisma.inboundEvent.findMany({
    where: {
      tenantId: user.tenantId
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100,
    include: {
      outboundReplies: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  })

  return {
    message: '受信イベントを取得しました',
    events
  }
})
