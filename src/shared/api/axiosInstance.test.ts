import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios, { type AxiosInstance } from 'axios'

import { mockAccessToken, mockUser } from '@/entities/user/mock/mockUser'

type InterceptorHandler = { fulfilled?: unknown; rejected?: unknown }

function getRequestHandler(instance: AxiosInstance) {
  const handlers = (
    instance.interceptors.request as unknown as {
      handlers: InterceptorHandler[]
    }
  ).handlers
  return handlers.find((h) => h !== null) as InterceptorHandler
}

function getResponseHandler(instance: AxiosInstance) {
  const handlers = (
    instance.interceptors.response as unknown as {
      handlers: InterceptorHandler[]
    }
  ).handlers
  return handlers.find((h) => h !== null) as InterceptorHandler
}

/*
 * 모듈 레벨 isRefreshing, failedQueue 변수가 테스트 간 공유되므로
 * vi.resetModules() + 동적 import로 각 테스트를 격리한다.
 * vi.doMock은 beforeEach에서 resetModules 후 재등록하여 매 테스트마다 mock이 적용된다.
 */
describe('axiosInstance', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Request interceptor', () => {
    it('AT가 있을 때 Authorization: Bearer 헤더를 주입한다', async () => {
      const { useAuthStore } = await import('@/entities/user/model/authStore')
      useAuthStore.getState().setAccessToken(mockAccessToken)

      const { axiosInstance } = await import('./axiosInstance')
      const { fulfilled } = getRequestHandler(axiosInstance)

      const config = { headers: new axios.AxiosHeaders() }
      const result = await (
        fulfilled as (c: unknown) => Promise<typeof config>
      )(config)

      expect(result.headers.Authorization).toBe(`Bearer ${mockAccessToken}`)
    })

    it('AT가 없을 때 Authorization 헤더를 포함하지 않는다', async () => {
      const { useAuthStore } = await import('@/entities/user/model/authStore')
      useAuthStore.getState().reset()

      const { axiosInstance } = await import('./axiosInstance')
      const { fulfilled } = getRequestHandler(axiosInstance)

      const config = { headers: new axios.AxiosHeaders() }
      const result = await (
        fulfilled as (c: unknown) => Promise<typeof config>
      )(config)

      expect(result.headers.Authorization).toBeUndefined()
    })
  })

  describe('Response interceptor', () => {
    it('401 이외의 에러는 그대로 reject한다', async () => {
      const { axiosInstance } = await import('./axiosInstance')
      const { rejected } = getResponseHandler(axiosInstance)

      const error = { response: { status: 500 }, config: { headers: {} } }
      await expect(
        (rejected as (e: unknown) => Promise<unknown>)(error)
      ).rejects.toEqual(error)
    })

    it('이미 _retry된 요청은 다시 retry하지 않는다', async () => {
      const { axiosInstance } = await import('./axiosInstance')
      const { rejected } = getResponseHandler(axiosInstance)

      const error = {
        response: { status: 401 },
        config: { headers: {}, _retry: true },
      }
      await expect(
        (rejected as (e: unknown) => Promise<unknown>)(error)
      ).rejects.toEqual(error)
    })

    it('401 응답 시 /auth/refresh를 호출한다', async () => {
      const { useAuthStore } = await import('@/entities/user/model/authStore')
      useAuthStore.getState().setAccessToken('expired-token')
      const { axiosInstance } = await import('./axiosInstance')

      const axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { accessToken: mockAccessToken, user: mockUser },
      })

      // 재시도 요청은 axiosInstance 어댑터를 mock하여 실제 HTTP 요청 방지
      axiosInstance.defaults.adapter = vi.fn().mockResolvedValueOnce({
        data: 'retried',
        status: 200,
        headers: {},
        config: {},
      })

      const { rejected } = getResponseHandler(axiosInstance)

      const error = {
        response: { status: 401 },
        config: { headers: new axios.AxiosHeaders(), _retry: false },
      }

      await (rejected as (e: unknown) => Promise<unknown>)(error)

      expect(axiosPostSpy).toHaveBeenCalledWith('/auth/refresh', null, {
        withCredentials: true,
      })
    })

    it('401 응답 시 refresh 성공 후 새 토큰으로 재시도한다', async () => {
      const { useAuthStore } = await import('@/entities/user/model/authStore')
      useAuthStore.getState().setAccessToken('expired-token')
      const { axiosInstance } = await import('./axiosInstance')

      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { accessToken: mockAccessToken, user: mockUser },
      })

      axiosInstance.defaults.adapter = vi.fn().mockResolvedValueOnce({
        data: 'success',
        status: 200,
        headers: {},
        config: {},
      })

      const { rejected } = getResponseHandler(axiosInstance)

      const error = {
        response: { status: 401 },
        config: { headers: new axios.AxiosHeaders(), _retry: false },
      }

      await (rejected as (e: unknown) => Promise<unknown>)(error)

      expect(useAuthStore.getState().accessToken).toBe(mockAccessToken)
    })

    it('refresh 실패 시 authStore.reset()을 호출한다', async () => {
      const { useAuthStore } = await import('@/entities/user/model/authStore')
      useAuthStore.getState().setAccessToken(mockAccessToken)

      const { axiosInstance } = await import('./axiosInstance')

      vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('refresh failed'))

      const { rejected } = getResponseHandler(axiosInstance)

      const error = {
        response: { status: 401 },
        config: { headers: new axios.AxiosHeaders(), _retry: false },
      }

      await expect(
        (rejected as (e: unknown) => Promise<unknown>)(error)
      ).rejects.toThrow()
      expect(useAuthStore.getState().accessToken).toBeNull()
    })

    it('동시 401 요청 시 refresh는 한 번만 호출된다', async () => {
      const { useAuthStore } = await import('@/entities/user/model/authStore')
      useAuthStore.getState().setAccessToken('expired-token')
      const { axiosInstance } = await import('./axiosInstance')

      let resolveRefresh!: (val: unknown) => void
      const refreshPromise = new Promise((res) => {
        resolveRefresh = res
      })

      const axiosPostSpy = vi
        .spyOn(axios, 'post')
        .mockReturnValueOnce(refreshPromise as ReturnType<typeof axios.post>)
      axiosInstance.defaults.adapter = vi.fn().mockResolvedValue({
        data: 'retried',
        status: 200,
        headers: {},
        config: {},
      })

      const { rejected } = getResponseHandler(axiosInstance)

      const makeError = () => ({
        response: { status: 401 },
        config: { headers: new axios.AxiosHeaders(), _retry: false },
      })

      const p1 = (rejected as (e: unknown) => Promise<unknown>)(makeError())
      const p2 = (rejected as (e: unknown) => Promise<unknown>)(makeError())

      resolveRefresh({ data: { accessToken: mockAccessToken, user: mockUser } })

      await Promise.all([p1, p2])

      expect(axiosPostSpy).toHaveBeenCalledTimes(1)
    })

    it('로그아웃으로 AT가 제거된 뒤 도착한 401은 refresh하지 않는다', async () => {
      const { axiosInstance } = await import('./axiosInstance')
      const axiosPostSpy = vi.spyOn(axios, 'post')
      const { rejected } = getResponseHandler(axiosInstance)
      const error = {
        response: { status: 401 },
        config: { headers: new axios.AxiosHeaders(), _retry: false },
      }

      await expect(
        (rejected as (e: unknown) => Promise<unknown>)(error)
      ).rejects.toEqual(error)
      expect(axiosPostSpy).not.toHaveBeenCalled()
    })
  })
})
