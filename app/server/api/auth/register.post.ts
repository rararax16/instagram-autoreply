import { prisma } from '../../utils/prisma'
import { hashPassword } from '../../utils/password'
import { setSessionCookie } from '../../utils/session'

type RegisterBody = {
  tenantName?: string
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event)
  const tenantName = body.tenantName?.trim() || '新規テナント'
  const email = body.email?.trim().toLowerCase() || ''
  const password = body.password?.trim() || ''

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'メールアドレスは必須です' })
  }

  if (!password || password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'パスワードは8文字以上で入力してください' })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    throw createError({ statusCode: 409, statusMessage: 'このメールアドレスは既に登録されています' })
  }

  const passwordHash = hashPassword(password)

  const user = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: tenantName
      }
    })

    return tx.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash
      },
      select: {
        id: true,
        tenantId: true,
        email: true
      }
    })
  })

  setSessionCookie(event, {
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email
  })

  return {
    message: 'ユーザー登録が完了しました',
    user
  }
})
