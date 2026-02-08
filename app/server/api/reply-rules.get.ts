import { EventChannel } from '@prisma/client'
import { requireAuth } from '../utils/auth'
import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const channelText = typeof query.channel === 'string' ? query.channel.toUpperCase() : undefined
  const channel = channelText === 'DM' || channelText === 'COMMENT' ? channelText as EventChannel : undefined

  const rules = await prisma.replyRule.findMany({
    where: {
      tenantId: user.tenantId,
      channel
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  return {
    message: '返信ルール一覧を取得しました',
    rules
  }
})
