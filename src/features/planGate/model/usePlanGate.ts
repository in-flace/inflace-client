import { isPlanBelow } from '@/shared/api'
import { useAuthStore } from '@/entities/user'
import type { UserPlan } from '@/shared/api/types'

export function usePlanGate(requiredPlan: UserPlan) {
  const user = useAuthStore((s) => s.user)
  const userPlan: UserPlan = (user?.userDetails.plan as UserPlan) ?? 'FREE'
  const isLocked = isPlanBelow(userPlan, requiredPlan)
  return { isLocked }
}
