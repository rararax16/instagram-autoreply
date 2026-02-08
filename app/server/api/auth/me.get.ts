import { getAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)

  if (!user) {
    return {
      authenticated: false,
      user: null
    }
  }

  return {
    authenticated: true,
    user
  }
})
