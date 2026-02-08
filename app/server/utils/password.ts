import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(':')

  if (!salt || !originalHash) {
    return false
  }

  const computedHash = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  const original = Buffer.from(originalHash, 'hex')
  const computed = Buffer.from(computedHash, 'hex')

  if (original.length !== computed.length) {
    return false
  }

  return timingSafeEqual(original, computed)
}
