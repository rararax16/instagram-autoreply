import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const config = useRuntimeConfig()
  const rawKey = config.tokenEncryptionKey || process.env.TOKEN_ENCRYPTION_KEY || ''

  if (!rawKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'TOKEN_ENCRYPTION_KEY が設定されていません'
    })
  }

  return createHash('sha256').update(rawKey).digest()
}

export function encryptText(plainText: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf-8'),
    cipher.final()
  ])

  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`
}

export function decryptText(cipherText: string): string {
  const [ivText, authTagText, encryptedText] = cipherText.split('.')

  if (!ivText || !authTagText || !encryptedText) {
    throw createError({
      statusCode: 500,
      statusMessage: 'トークンの復号に失敗しました'
    })
  }

  const key = getEncryptionKey()
  const iv = Buffer.from(ivText, 'base64url')
  const authTag = Buffer.from(authTagText, 'base64url')
  const encrypted = Buffer.from(encryptedText, 'base64url')
  const decipher = createDecipheriv(ALGORITHM, key, iv)

  decipher.setAuthTag(authTag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf-8')
}
