import { requireAdmin } from '../utils/auth'
import { hashPassword } from '../utils/password'
import { prisma } from '../utils/prisma'

type UserRole = 'ADMIN' | 'MEMBER'

type CreateUserBody = {
  email?: string
  password?: string
  role?: string
}

function parseRole(value: string | undefined): UserRole {
  if (!value || value === 'MEMBER') {
    return 'MEMBER'
  }

  if (value === 'ADMIN') {
    return 'ADMIN'
  }

  throw createError({
    statusCode: 400,
    message: 'ロールはADMINまたはMEMBERを指定してください'
  })
}

export default defineEventHandler(async (event) => {
  const adminUser = await requireAdmin(event)
  const body = await readBody<CreateUserBody>(event)
  const email = body.email?.trim().toLowerCase() || ''
  const password = body.password?.trim() || ''
  const role = parseRole(body.role?.trim().toUpperCase())

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

  const existingUser = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true
    }
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'このメールアドレスは既に登録されています'
    })
  }

  const user = await prisma.user.create({
    data: {
      tenantId: adminUser.tenantId,
      email,
      passwordHash: hashPassword(password),
      role
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return {
    message: 'ユーザーを作成しました',
    user
  }
})
