import { prisma } from '../../utils/prisma'
import { verifyPassword } from '../../utils/password'
import { setSessionCookie } from '../../utils/session'

type LoginBody = {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const email = body.email?.trim().toLowerCase() || ''
  const password = body.password?.trim() || ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'メールアドレスとパスワードを入力してください' })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      tenantId: true,
      email: true,
      role: true,
      passwordHash: true
    }
  })

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'メールアドレスまたはパスワードが正しくありません' })
  }

  setSessionCookie(event, {
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email
  })

  return {
    message: 'ログインしました',
    user: {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role
    }
  }
})
