import { EventChannel } from '@prisma/client'
import { requireAuth } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

type UpdateBody = {
  channel?: string
  keyword?: string
  replyText?: string
  priority?: number
  isActive?: boolean
}

function toChannel(channel: string | undefined): EventChannel | undefined {
  if (!channel) {
    return undefined
  }

  const upper = channel.toUpperCase()

  if (upper === 'DM' || upper === 'COMMENT') {
    return upper
  }

  throw createError({ statusCode: 400, statusMessage: 'チャネルはDMまたはCOMMENTを指定してください' })
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateBody>(event)

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

  const data: {
    channel?: EventChannel
    keyword?: string
    replyText?: string
    priority?: number
    isActive?: boolean
  } = {}

  if (typeof body.keyword === 'string') {
    const keyword = body.keyword.trim()

    if (!keyword) {
      throw createError({ statusCode: 400, statusMessage: 'キーワードは必須です' })
    }

    data.keyword = keyword
  }

  if (typeof body.replyText === 'string') {
    const replyText = body.replyText.trim()

    if (!replyText) {
      throw createError({ statusCode: 400, statusMessage: '返信内容を入力してください' })
    }

    data.replyText = replyText
  }

  if (typeof body.priority === 'number') {
    data.priority = body.priority
  }

  if (typeof body.isActive === 'boolean') {
    data.isActive = body.isActive
  }

  const channel = toChannel(body.channel)
  if (channel) {
    data.channel = channel
  }

  const rule = await prisma.replyRule.update({
    where: { id: existing.id },
    data
  })

  return {
    message: '返信ルールを更新しました',
    rule
  }
})
