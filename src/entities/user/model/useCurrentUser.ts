'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchCurrentUser } from '../api/userApi'
import { useAuthStore } from './authStore'

export const CURRENT_USER_QUERY_KEY = ['currentUser'] as const

export function useCurrentUser() {
  const enabled = useAuthStore((state) => Boolean(state.accessToken))

  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled,
  })
}
