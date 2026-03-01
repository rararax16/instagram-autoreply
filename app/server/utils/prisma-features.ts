import { prisma } from './prisma'

type RuntimeDataModel = {
  models?: Record<string, { fields?: Array<{ name?: string }> }>
}

export function hasInboundSenderUsernameField(): boolean {
  const runtimeDataModel = (prisma as unknown as { _runtimeDataModel?: RuntimeDataModel })._runtimeDataModel
  const model = runtimeDataModel?.models?.InboundEvent

  if (!model?.fields) {
    return false
  }

  return model.fields.some((field) => field.name === 'senderUsername')
}
