import { decryptText } from '../utils/crypto'
import { prisma } from '../utils/prisma'

export type SendInstagramReplyInput = {
  tenantId: string
  platformUserId: string
  recipientId: string
  text: string
  channel: 'DM' | 'COMMENT'
  commentId?: string
}

export type SendInstagramReplyResult = {
  success: boolean
  status: 'SENT' | 'FAILED'
  message?: string
  externalReplyId?: string
}

export type FetchInstagramSenderUsernameInput = {
  tenantId: string
  senderId: string
  platformUserId?: string
}

type InstagramDmResponse = {
  message_id?: string
  id?: string
}

type InstagramCommentReplyResponse = {
  id?: string
}

type InstagramSenderProfileResponse = {
  username?: string
}

type InstagramConversationResponse = {
  data?: Array<{
    participants?: {
      data?: Array<{
        id?: string
        username?: string
      }>
    }
  }>
}

function normalizeApiVersion(version: string): string {
  if (!version) {
    return 'v24.0'
  }

  return version.startsWith('v') ? version : `v${version}`
}

function getApiVersion(): string {
  const config = useRuntimeConfig()
  return normalizeApiVersion(config.metaApiVersion || process.env.META_API_VERSION || 'v24.0')
}

function getErrorMessage(error: any, fallback: string): string {
  return error?.data?.error?.message || error?.data?.error_message || error?.message || fallback
}

function normalizeUsername(username: string | undefined): string | null {
  if (!username) {
    return null
  }

  const normalized = username.trim().replace(/^@/, '')
  return normalized || null
}

async function getAccountAccessToken(tenantId: string, platformUserId: string): Promise<{
  accessToken: string | null
  message?: string
}> {
  const account = await prisma.igAccount.findFirst({
    where: {
      tenantId,
      platformUserId,
      enabled: true
    },
    select: {
      accessTokenEncrypted: true
    }
  })

  if (!account) {
    return {
      accessToken: null,
      message: '有効なInstagram連携アカウントが見つかりません'
    }
  }

  try {
    return {
      accessToken: decryptText(account.accessTokenEncrypted)
    }
  }
  catch {
    return {
      accessToken: null,
      message: 'Instagramアクセストークンの復号に失敗しました'
    }
  }
}

async function fetchSenderUsernameFromConversation(
  platformUserId: string,
  senderId: string,
  accessToken: string
): Promise<string | null> {
  const apiVersion = getApiVersion()
  const endpoints = [
    `https://graph.facebook.com/${apiVersion}/${platformUserId}/conversations`,
    `https://graph.instagram.com/${apiVersion}/${platformUserId}/conversations`
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await $fetch<InstagramConversationResponse>(endpoint, {
        query: {
          platform: 'instagram',
          user_id: senderId,
          fields: 'participants',
          access_token: accessToken
        }
      })

      for (const conversation of response.data || []) {
        for (const participant of conversation.participants?.data || []) {
          if (participant.id !== senderId) {
            continue
          }

          const username = normalizeUsername(participant.username)
          if (username) {
            return username
          }
        }
      }
    }
    catch {
      // 会話APIが使えないケースは次の候補へ
    }
  }

  return null
}

async function fetchSenderUsernameWithAccessToken(
  senderId: string,
  accessToken: string,
  platformUserId?: string
): Promise<string | null> {
  if (platformUserId) {
    const conversationUsername = await fetchSenderUsernameFromConversation(platformUserId, senderId, accessToken)
    if (conversationUsername) {
      return conversationUsername
    }
  }

  const apiVersion = getApiVersion()
  const endpoints = [
    `https://graph.facebook.com/${apiVersion}/${senderId}`,
    `https://graph.facebook.com/${senderId}`,
    `https://graph.instagram.com/${apiVersion}/${senderId}`,
    `https://graph.instagram.com/${senderId}`
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await $fetch<InstagramSenderProfileResponse>(endpoint, {
        query: {
          fields: 'username',
          access_token: accessToken
        }
      })
      const username = normalizeUsername(response.username)
      if (username) {
        return username
      }
    }
    catch {
      // ユーザー情報取得に失敗するケースがあるため、次の候補へフォールバック
    }
  }

  return null
}

export async function fetchInstagramSenderUsername(
  input: FetchInstagramSenderUsernameInput
): Promise<string | null> {
  const senderId = input.senderId.trim()

  if (!senderId || senderId === 'unknown') {
    return null
  }

  const accounts = await prisma.igAccount.findMany({
    where: {
      tenantId: input.tenantId,
      enabled: true
    },
    select: {
      platformUserId: true,
      accessTokenEncrypted: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  if (accounts.length === 0) {
    return null
  }

  const prioritizedAccounts = input.platformUserId
    ? [
        ...accounts.filter((account) => account.platformUserId === input.platformUserId),
        ...accounts.filter((account) => account.platformUserId !== input.platformUserId)
      ]
    : accounts

  for (const account of prioritizedAccounts) {
    let accessToken = ''
    try {
      accessToken = decryptText(account.accessTokenEncrypted)
    }
    catch {
      continue
    }

    const username = await fetchSenderUsernameWithAccessToken(senderId, accessToken, account.platformUserId)
    if (username) {
      return username
    }
  }

  return null
}

async function sendDmReply(
  input: SendInstagramReplyInput,
  accessToken: string
): Promise<SendInstagramReplyResult> {
  const apiVersion = getApiVersion()
  const endpoints = [
    `https://graph.instagram.com/${apiVersion}/${input.platformUserId}/messages`,
    `https://graph.instagram.com/${input.platformUserId}/messages`,
    `https://graph.facebook.com/${apiVersion}/${input.platformUserId}/messages`
  ]

  let lastErrorMessage = 'Instagram DM送信に失敗しました'

  for (const endpoint of endpoints) {
    try {
      const response = await $fetch<InstagramDmResponse>(endpoint, {
        method: 'POST',
        query: {
          access_token: accessToken
        },
        body: {
          recipient: {
            id: input.recipientId
          },
          message: {
            text: input.text
          },
          messaging_type: 'RESPONSE'
        }
      })

      return {
        success: true,
        status: 'SENT',
        externalReplyId: response.message_id || response.id
      }
    }
    catch (error: any) {
      lastErrorMessage = getErrorMessage(error, lastErrorMessage)
    }
  }

  return {
    success: false,
    status: 'FAILED',
    message: lastErrorMessage
  }
}

async function sendCommentReply(
  input: SendInstagramReplyInput,
  accessToken: string
): Promise<SendInstagramReplyResult> {
  if (!input.commentId) {
    return {
      success: false,
      status: 'FAILED',
      message: 'コメント返信に必要なコメントIDがありません'
    }
  }

  const apiVersion = getApiVersion()
  const endpoints = [
    `https://graph.instagram.com/${apiVersion}/${input.commentId}/replies`,
    `https://graph.instagram.com/${input.commentId}/replies`,
    `https://graph.facebook.com/${apiVersion}/${input.commentId}/replies`
  ]
  let lastErrorMessage = 'Instagramコメント返信に失敗しました'

  for (const endpoint of endpoints) {
    try {
      const response = await $fetch<InstagramCommentReplyResponse>(endpoint, {
        method: 'POST',
        query: {
          access_token: accessToken
        },
        body: {
          message: input.text
        }
      })

      return {
        success: true,
        status: 'SENT',
        externalReplyId: response.id
      }
    }
    catch (error: any) {
      lastErrorMessage = getErrorMessage(error, lastErrorMessage)
    }
  }

  return {
    success: false,
    status: 'FAILED',
    message: lastErrorMessage
  }
}

export async function sendInstagramReply(input: SendInstagramReplyInput): Promise<SendInstagramReplyResult> {
  if (!input.text.trim()) {
    return {
      success: false,
      status: 'FAILED',
      message: '返信テキストが空です'
    }
  }

  const tokenResult = await getAccountAccessToken(input.tenantId, input.platformUserId)
  if (!tokenResult.accessToken) {
    return {
      success: false,
      status: 'FAILED',
      message: tokenResult.message
    }
  }

  if (input.channel === 'COMMENT') {
    return sendCommentReply(input, tokenResult.accessToken)
  }

  return sendDmReply(input, tokenResult.accessToken)
}
