import { EventChannel } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { requireAuth } from '../utils/auth'
import { processInboundEvent } from '../utils/auto-reply'
import { prisma } from '../utils/prisma'
import { hasInboundSenderUsernameField } from '../utils/prisma-features'

type InboundBody = {
  channel?: string
  senderId?: string
  senderUsername?: string
  content?: string
  externalEventId?: string
}

function toChannel(channel: string | undefined): EventChannel {
  const upper = channel?.toUpperCase()

  if (upper === 'DM' || upper === 'COMMENT') {
    return upper
  }

  throw createError({ statusCode: 400, statusMessage: 'チャネルはDMまたはCOMMENTを指定してください' })
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const canStoreSenderUsername = hasInboundSenderUsernameField()
  const body = await readBody<InboundBody>(event)
  const channel = toChannel(body.channel)
  const senderId = body.senderId?.trim() || ''
  const senderUsername = body.senderUsername?.trim() || null
  const content = body.content?.trim() || ''

  if (!senderId) {
    throw createError({ statusCode: 400, statusMessage: '送信者IDは必須です' })
  }

  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'メッセージ本文は必須です' })
  }

  const inboundEventData: Record<string, unknown> = {
    tenantId: user.tenantId,
    channel,
    externalEventId: body.externalEventId?.trim() || randomUUID(),
    senderId,
    content
  }

  if (canStoreSenderUsername) {
    inboundEventData.senderUsername = senderUsername
  }

  const inboundEvent = await prisma.inboundEvent.create({
    data: inboundEventData as any
  })

  const outboundReply = await processInboundEvent({
    tenantId: user.tenantId,
    inboundEventId: inboundEvent.id,
    channel,
    senderId,
    content
  })

  return {
    message: '受信イベントを保存し、自動返信処理を実行しました',
    inboundEvent,
    outboundReply
  }
})
