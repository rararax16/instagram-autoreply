export type SendInstagramReplyInput = {
  platformUserId: string
  recipientId: string
  text: string
  channel: 'DM' | 'COMMENT'
}

export type SendInstagramReplyResult = {
  success: boolean
  status: 'STUBBED' | 'FAILED'
  message?: string
  externalReplyId?: string
}

export async function sendInstagramReply(_: SendInstagramReplyInput): Promise<SendInstagramReplyResult> {
  return {
    success: true,
    status: 'STUBBED',
    message: 'プロトタイプのためInstagram送信はスタブです',
    externalReplyId: `stub_${Date.now()}`
  }
}
