import { EventChannel, ReplyStatus } from '@prisma/client'
import { prisma } from './prisma'
import { sendInstagramReply } from '../services/instagram.service'

export type ProcessInboundEventInput = {
  tenantId: string
  inboundEventId: string
  channel: EventChannel
  senderId: string
  content: string
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase()
}

export async function processInboundEvent(input: ProcessInboundEventInput) {
  const rules = await prisma.replyRule.findMany({
    where: {
      tenantId: input.tenantId,
      channel: input.channel,
      isActive: true
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  const incomingText = normalizeText(input.content)
  const matchedRule = rules.find((rule) => {
    return incomingText.includes(normalizeText(rule.keyword))
  })

  if (!matchedRule) {
    return prisma.outboundReply.create({
      data: {
        tenantId: input.tenantId,
        inboundEventId: input.inboundEventId,
        replyText: '',
        status: ReplyStatus.SKIPPED,
        errorMessage: '一致する返信ルールがありませんでした'
      }
    })
  }

  const inboundEvent = await prisma.inboundEvent.update({
    where: { id: input.inboundEventId },
    data: { matchedRuleId: matchedRule.id },
    select: {
      externalEventId: true
    }
  })

  const account = await prisma.igAccount.findFirst({
    where: {
      tenantId: input.tenantId,
      enabled: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  if (!account) {
    return prisma.outboundReply.create({
      data: {
        tenantId: input.tenantId,
        inboundEventId: input.inboundEventId,
        replyText: matchedRule.replyText,
        status: ReplyStatus.FAILED,
        errorMessage: '有効なInstagram連携アカウントが見つかりません'
      }
    })
  }

  const sendResult = await sendInstagramReply({
    tenantId: input.tenantId,
    platformUserId: account.platformUserId,
    recipientId: input.senderId,
    text: matchedRule.replyText,
    channel: input.channel,
    commentId: input.channel === EventChannel.COMMENT ? inboundEvent.externalEventId : undefined
  })

  const replyStatus = sendResult.status === 'SENT'
    ? ReplyStatus.SENT
    : ReplyStatus.FAILED

  return prisma.outboundReply.create({
    data: {
      tenantId: input.tenantId,
      inboundEventId: input.inboundEventId,
      replyText: matchedRule.replyText,
      status: replyStatus,
      errorMessage: sendResult.success ? null : (sendResult.message || '返信送信に失敗しました')
    }
  })
}
