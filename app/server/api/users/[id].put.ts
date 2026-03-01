import { requireAdmin } from '../../utils/auth'
import { hashPassword } from '../../utils/password'
import { prisma } from '../../utils/prisma'

type UserRole = 'ADMIN' | 'MEMBER'

type UpdateUserBody = {
  email?: string
  password?: string
  role?: string
}

function parseRole(value: string | undefined): UserRole | undefined {
  if (typeof value === 'undefined') {
    return undefined
  }

  if (value === 'ADMIN') {
    return 'ADMIN'
  }

  if (value === 'MEMBER') {
    return 'MEMBER'
  }

  throw createError({
    statusCode: 400,
    message: 'ロールはADMINまたはMEMBERを指定してください'
  })
}

export default defineEventHandler(async (event) => {
  const adminUser = await requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody<UpdateUserBody>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ユーザーIDが不正です'
    })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()
  const role = parseRole(body.role?.trim().toUpperCase())

  if (!email && !password && !role) {
    throw createError({
      statusCode: 400,
      message: '更新内容が指定されていません'
    })
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id
    },
    select: {
      id: true,
      role: true
    }
  })

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      message: '対象ユーザーが見つかりません'
    })
  }

  if (password && password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'パスワードは8文字以上で入力してください'
    })
  }

  if (role === 'MEMBER' && targetUser.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    })

    if (adminCount <= 1) {
      throw createError({
        statusCode: 400,
        message: '管理者ユーザーが0件になるため変更できません'
      })
    }
  }

  if (role === 'MEMBER' && targetUser.id === adminUser.id) {
    throw createError({
      statusCode: 400,
      message: '自身の管理者権限は変更できません'
    })
  }

  const data: {
    email?: string
    passwordHash?: string
    role?: UserRole
  } = {}

  if (email) {
    data.email = email
  }

  if (password) {
    data.passwordHash = hashPassword(password)
  }

  if (role) {
    data.role = role
  }

  try {
    const user = await prisma.user.update({
      where: {
        id
      },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return {
      message: 'ユーザー情報を更新しました',
      user
    }
  }
  catch (error: any) {
    if (error?.code === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'このメールアドレスは既に登録されています'
      })
    }

    throw error
  }
})
