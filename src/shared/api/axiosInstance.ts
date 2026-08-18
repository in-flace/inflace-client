import axios from 'axios'

import { useAuthStore } from './authStore'
import { useLoginModal } from '@/features/auth/model/useLoginModal'

const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}`,
  withCredentials: true,
})

//서버에게 보낼 요청 메세지를 가로채서 헤더에 access token을 삽입
axiosInstance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

/*
 * 중복 요청을 방지하기 위함
 * 첫 번째 401이 refresh를 시작하면(isRefreshing = true)
 * 나머지 요청들은 failedQueue에 쌓인다
 */
let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token)
    } else {
      promise.reject(error)
    }
  })
  failedQueue = []
}

//서버로부터 받은 응답 메세지를 가로채서 에러 메세지를 판단
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return axiosInstance(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post('/auth/refresh', null, {
        withCredentials: true,
      })

      const { accessToken } = data
      const { user } = useAuthStore.getState()
      useAuthStore.getState().setAuth(accessToken, user)
      processQueue(null, accessToken)

      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return axiosInstance(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().reset()
      // refresh 실패 시 현재 화면 그대로 로그인 모달 오픈
      /* 사용자가 연 것이 아니라 세션 만료로 강제로 뜬 것이다.
       * 전환율 분모에서 빼야 하므로 다른 값으로 구분한다. */
      useLoginModal.getState().open('session_expired')
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export { axiosInstance }
