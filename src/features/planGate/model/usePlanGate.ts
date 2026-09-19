import { isPaidPlan, useCurrentUser } from '@/entities/user'
import type { UserPlan } from '@/entities/user'

export function usePlanGate() {
  const { data: user } = useCurrentUser()
  const userPlan: UserPlan = (user?.userDetails.plan as UserPlan) ?? 'FREE'
  const isLocked = !isPaidPlan(userPlan)
  return { isLocked }
}
