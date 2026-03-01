import { requireAuth } from '../utils/auth'
import { prisma } from '../utils/prisma'

function getEventSenderUsername(inboundEvent: unknown): string | null {
  if (!inboundEvent || typeof inboundEvent !== 'object') {
    return null
  }

  const senderUsername = (inboundEvent as { senderUsername?: unknown }).senderUsername
  return typeof senderUsername === 'string' && senderUsername.trim() ? senderUsername : null
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const accounts = await prisma.igAccount.findMany({
    where: {
      tenantId: user.tenantId
    },
    select: {
      platformUserId: true
    }
  })
  const ownSenderIds = new Set(accounts.map((account) => account.platformUserId))

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

  const eventsWithSenderType = events.map((inboundEvent) => {
    return {
      ...inboundEvent,
      senderUsername: getEventSenderUsername(inboundEvent),
      isSelfEvent: ownSenderIds.has(inboundEvent.senderId)
    }
  })

  return {
    message: '受信イベントを取得しました',
    events: eventsWithSenderType
  }
})
