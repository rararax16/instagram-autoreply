import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined, appSecret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false
  }

  const receivedSignature = signatureHeader.replace('sha256=', '')
  const expectedSignature = createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const expected = Buffer.from(expectedSignature)
  const received = Buffer.from(receivedSignature)

  if (expected.length !== received.length) {
    return false
  }

  return timingSafeEqual(expected, received)
}
