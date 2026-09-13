import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAlarm, postAlarm } from '../api/alarmApi'
import type { Alarms } from '../model/types'
import { useAuthStore } from '@/entities/user'

export function useAlarm() {
  const accessToken = useAuthStore((state) => state.accessToken)
  return useQuery({
    queryKey: ['alarm'],
    queryFn: () => fetchAlarm(),
    enabled: !!accessToken,
  })
}

export function useEditAlarm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Alarms) => postAlarm(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarm'] })
    },
  })
}
