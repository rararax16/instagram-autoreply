import { EventChannel } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { processInboundEvent } from '../../utils/auto-reply'
import { prisma } from '../../utils/prisma'
import { verifyWebhookSignature } from '../../utils/webhook'

type ParsedEvent = {
  tenantId?: string
  platformUserId?: string
  channel: EventChannel
  senderId: string
  content: string
  externalEventId: string
}

function parseWebhookPayload(payload: any): ParsedEvent[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const parsed: ParsedEvent[] = []

  if (Array.isArray(payload.events)) {
    for (const event of payload.events) {
      if (!event || typeof event !== 'object') {
        continue
      }

      const channel = typeof event.channel === 'string' && event.channel.toUpperCase() === 'COMMENT'
        ? EventChannel.COMMENT
        : EventChannel.DM

      parsed.push({
        tenantId: typeof event.tenantId === 'string' ? event.tenantId : undefined,
        platformUserId: typeof event.platformUserId === 'string' ? event.platformUserId : undefined,
        channel,
        senderId: typeof event.senderId === 'string' ? event.senderId : 'unknown',
        content: typeof event.content === 'string' ? event.content : '',
        externalEventId: typeof event.externalEventId === 'string' ? event.externalEventId : randomUUID()
      })
    }
  }

  if (Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      const entryId = typeof entry?.id === 'string' ? entry.id : undefined

      if (Array.isArray(entry?.messaging)) {
        for (const messageEvent of entry.messaging) {
          const text = messageEvent?.message?.text
          if (typeof text !== 'string' || !text.trim()) {
            continue
          }

          parsed.push({
            platformUserId: entryId,
            channel: EventChannel.DM,
            senderId: messageEvent?.sender?.id || 'unknown',
            content: text,
            externalEventId: messageEvent?.message?.mid || randomUUID()
          })
        }
      }

      if (Array.isArray(entry?.changes)) {
        for (const change of entry.changes) {
          const value = change?.value
          const text = value?.text

          if (change?.field !== 'comments' || typeof text !== 'string' || !text.trim()) {
            continue
          }

          parsed.push({
            platformUserId: entryId,
            channel: EventChannel.COMMENT,
            senderId: value?.from?.id || 'unknown',
            content: text,
            externalEventId: value?.id || randomUUID()
          })
        }
      }
    }
  }

  return parsed
}

async function resolveTenantId(event: ParsedEvent): Promise<string | null> {
  if (event.tenantId) {
    return event.tenantId
  }

  if (!event.platformUserId) {
    return null
  }

  const account = await prisma.igAccount.findFirst({
    where: {
      platformUserId: event.platformUserId
    },
    select: {
      tenantId: true
    }
  })

  return account?.tenantId || null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const appSecret = config.metaAppSecret || process.env.META_APP_SECRET || ''

  if (!appSecret) {
    throw createError({ statusCode: 500, statusMessage: 'META_APP_SECRET が設定されていません' })
  }

  const rawBody = await readRawBody(event, 'utf-8')

  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Webhookの本文が空です' })
  }

  const signatureHeader = getHeader(event, 'x-hub-signature-256')
  const verified = verifyWebhookSignature(rawBody, signatureHeader, appSecret)

  if (!verified) {
    throw createError({ statusCode: 401, statusMessage: 'Webhook署名の検証に失敗しました' })
  }

  const payload = JSON.parse(rawBody)
  const parsedEvents = parseWebhookPayload(payload)

  let processedCount = 0

  for (const parsedEvent of parsedEvents) {
    if (!parsedEvent.content.trim()) {
      continue
    }

    const tenantId = await resolveTenantId(parsedEvent)
    if (!tenantId) {
      continue
    }

    const exists = await prisma.inboundEvent.findUnique({
      where: {
        tenantId_externalEventId: {
          tenantId,
          externalEventId: parsedEvent.externalEventId
        }
      },
      select: {
        id: true
      }
    })

    if (exists) {
      continue
    }

    const inboundEvent = await prisma.inboundEvent.create({
      data: {
        tenantId,
        channel: parsedEvent.channel,
        externalEventId: parsedEvent.externalEventId,
        senderId: parsedEvent.senderId,
        content: parsedEvent.content
      }
    })

    await processInboundEvent({
      tenantId,
      inboundEventId: inboundEvent.id,
      channel: parsedEvent.channel,
      senderId: parsedEvent.senderId,
      content: parsedEvent.content
    })

    processedCount += 1
  }

  return {
    message: 'Webhookイベントを処理しました',
    processedCount
  }
})
