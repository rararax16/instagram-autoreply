import { prisma } from '../../utils/prisma'
import { hashPassword } from '../../utils/password'
import { setSessionCookie } from '../../utils/session'

type RegisterBody = {
  tenantName?: string
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const userCount = await prisma.user.count()

  if (userCount > 0) {
    throw createError({
      statusCode: 403,
      message: '新規登録は管理者機能から実施してください'
    })
  }

  const body = await readBody<RegisterBody>(event)
  const tenantName = body.tenantName?.trim() || '初期テナント'
  const email = body.email?.trim().toLowerCase() || ''
  const password = body.password?.trim() || ''

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'メールアドレスは必須です'
    })
  }

  if (!password || password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'パスワードは8文字以上で入力してください'
    })
  }

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
        passwordHash: hashPassword(password),
        role: 'ADMIN'
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true
      }
    })
  })

  setSessionCookie(event, {
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email
  })

  return {
    message: '初期管理者を登録しました',
    user
  }
})
