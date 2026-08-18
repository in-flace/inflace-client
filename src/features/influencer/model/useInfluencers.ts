import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useInfiniteScroll } from '@/shared/lib/hooks/useInfiniteScroll'
import type { Influencer } from '@/entities/influencer'
import type { InfiniteData, QueryKey } from '@tanstack/react-query'

import {
  fetchInfluencers,
  addBookmark,
  removeBookmark,
} from '../api/influencerApi'
import type {
  FetchInfluencersParams,
  InfluencerListResponse,
} from '../api/influencerApi'

const INFLUENCERS_QUERY_KEY = ['influencers']

/* 상세 화면도 같은 북마크 상태를 그린다. 목록만 갱신하면 두 화면의 하트가 따로 논다.
 * features/influencerDetail의 키를 문자열로 참조하는 건 느슨한 결합이라,
 * 쿼리 키를 shared에 모으게 되면 그때 함께 옮기는 것이 맞다. */
const INFLUENCER_DETAIL_QUERY_KEY = ['influencerDetail']

export function useInfluencers(
  filters?: Omit<FetchInfluencersParams, 'cursor'>
) {
  return useInfiniteScroll({
    queryKey: [...INFLUENCERS_QUERY_KEY, filters],
    queryFn: ({ pageParam }) =>
      fetchInfluencers({ ...filters, cursor: pageParam }),
  })
}

/* 북마크 토글.
 *
 * 응답을 기다리지 않고 캐시를 먼저 바꾼다(낙관적 갱신). 하트가 즉시 반응해야
 * 하기 때문이다. 대신 실패하면 반드시 되돌려야 한다 — 이전 구현은 요청을 던지고
 * 결과를 무시해서, 실패해도 화면은 저장된 것처럼 남고 사용자는 새로고침 전까지
 * 알 수 없었다. */
type BookmarkToggleVariables = {
  channelId: number
  bookmarked: boolean
}

export function useBookmarkToggle() {
  const queryClient = useQueryClient()

  const { mutate } = useMutation({
    mutationFn: async ({ channelId, bookmarked }: BookmarkToggleVariables) => {
      const response = bookmarked
        ? await addBookmark(channelId)
        : await removeBookmark(channelId)

      /* HTTP 200으로 오면서 success: false로 실패를 알리는 응답이 있다.
       * axios는 이 경우 예외를 던지지 않으므로 여기서 실패로 만들어야
       * onError의 되돌림이 동작한다. */
      if (!response.success) {
        throw new Error(
          response.error?.message ?? '북마크 처리에 실패했습니다.'
        )
      }
      return response
    },

    onMutate: async ({ channelId, bookmarked }) => {
      /* 진행 중인 조회가 나중에 도착해 낙관적 갱신을 덮어쓰지 않도록 멈춘다. */
      await queryClient.cancelQueries({ queryKey: INFLUENCERS_QUERY_KEY })
      await queryClient.cancelQueries({ queryKey: INFLUENCER_DETAIL_QUERY_KEY })

      /* 되돌리기 위해 바꾸기 전 값을 모아 둔다. */
      const snapshots: [QueryKey, unknown][] = []

      queryClient
        .getQueryCache()
        .findAll({ queryKey: INFLUENCERS_QUERY_KEY })
        .forEach(({ queryKey }) => {
          snapshots.push([queryKey, queryClient.getQueryData(queryKey)])
          queryClient.setQueryData<InfiniteData<InfluencerListResponse>>(
            queryKey,
            (prev) => {
              if (!prev) return prev
              return {
                ...prev,
                pages: prev.pages.map((page) => ({
                  ...page,
                  content: page.content.map((influencer: Influencer) =>
                    influencer.channelId === channelId
                      ? { ...influencer, bookmarked }
                      : influencer
                  ),
                })),
              }
            }
          )
        })

      const detailKey = [...INFLUENCER_DETAIL_QUERY_KEY, String(channelId)]
      snapshots.push([detailKey, queryClient.getQueryData(detailKey)])
      queryClient.setQueryData<{ bookmarked: boolean }>(detailKey, (prev) =>
        prev ? { ...prev, bookmarked } : prev
      )

      return { snapshots }
    },

    onError: (error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      toast(
        error instanceof Error ? error.message : '북마크 처리에 실패했습니다.'
      )
    },
  })

  return (channelId: number, bookmarked: boolean) =>
    mutate({ channelId, bookmarked })
}
